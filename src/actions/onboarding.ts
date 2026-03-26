"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

export const createFreeStoreSchema = z.object({
  storeName: z
    .string()
    .min(2, "Store name must be at least 2 characters.")
    .max(100, "Store name must be under 100 characters.")
    .trim(),
  branchName: z
    .string()
    .min(2, "Branch name must be at least 2 characters.")
    .max(100, "Branch name must be under 100 characters.")
    .trim(),
})

export type CreateFreeStoreInput = z.infer<typeof createFreeStoreSchema>

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type CreateFreeStoreResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// ---------------------------------------------------------------------------
// createFreeStoreAction
// ---------------------------------------------------------------------------

/**
 * Creates a Store, StoreMember (OWNER), StoreBranch, and a FREE StoreSubscription
 * atomically inside a Prisma $transaction.
 *
 * Security:
 *  - Requires an authenticated Better Auth session.
 *  - Prevents duplicate stores: a user who already owns a store is redirected
 *    to the dashboard instead.
 *
 * On success: redirects to /dashboard (redirect() is called outside the tx
 * so the error boundary never catches it as a thrown response).
 */
export async function createFreeStoreAction(
  input: CreateFreeStoreInput
): Promise<CreateFreeStoreResult | never> {
  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    return { success: false, error: "You must be signed in to create a store." }
  }

  const userId = session.user.id

  // ── 2. Validate input server-side (defense-in-depth) ─────────────────────
  const parsed = createFreeStoreSchema.safeParse(input)

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const [key, messages] of Object.entries(
      parsed.error.flatten().fieldErrors
    )) {
      fieldErrors[key] = messages as string[]
    }
    return {
      success: false,
      error: "Invalid form data. Please review your inputs.",
      fieldErrors,
    }
  }

  const { storeName, branchName } = parsed.data

  // ── 3. Guard: user must not already own a store ───────────────────────────
  const existingMembership = await prisma.storeMember.findFirst({
    where: { userId, role: "OWNER" },
  })

  if (existingMembership) {
    // Silently redirect instead of showing an error — they're already set up
    redirect("/dashboard")
  }

  // ── 4. Fetch the FREE plan (must exist in DB) ─────────────────────────────
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { tier: "FREE" },
  })

  if (!freePlan) {
    console.error("[createFreeStoreAction] FREE plan not found in database.")
    return {
      success: false,
      error:
        "The Free plan is not configured yet. Please contact support.",
    }
  }

  // ── 5. Atomic transaction ─────────────────────────────────────────────────
  //      All-or-nothing: store + member + branch + subscription created together.
  //      If any step throws, Prisma rolls back the entire transaction.
  try {
    await prisma.$transaction(async (tx) => {
      // 5a. Create Store
      const store = await tx.store.create({
        data: { name: storeName },
      })

      // 5b. Link user as OWNER
      await tx.storeMember.create({
        data: {
          storeId: store.id,
          userId,
          role: "OWNER",
        },
      })

      // 5c. Create first branch
      await tx.storeBranch.create({
        data: {
          storeId: store.id,
          name: branchName,
        },
      })

      // 5d. Activate FREE subscription
      //     Free plans don't expire — set period end far in the future.
      const farFuture = new Date()
      farFuture.setFullYear(farFuture.getFullYear() + 100)

      await tx.storeSubscription.create({
        data: {
          storeId: store.id,
          planId: freePlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: farFuture,
        },
      })
    })
  } catch (err) {
    console.error("[createFreeStoreAction] Transaction failed:", err)
    return {
      success: false,
      error:
        "Something went wrong while creating your store. Please try again.",
    }
  }

  // ── 6. Redirect outside the transaction (Next.js redirect throws) ─────────
  redirect("/dashboard")
}