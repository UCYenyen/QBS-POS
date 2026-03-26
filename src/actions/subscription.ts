"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Xendit from "xendit-node"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const xendit = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
})

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type CheckoutResult =
  | { success: true; invoiceUrl: string }
  | { success: false; error: string }

// --------------------------------------------------------------------------
// createSubscriptionCheckout
// --------------------------------------------------------------------------

/**
 * Initiates a Xendit Invoice checkout for a given plan.
 *
 * Security:
 *  - Verifies session via Better Auth.
 *  - Confirms the calling user is an OWNER of the target store.
 *  - Pulls price directly from DB — never trusts client input.
 *
 * Flow:
 *  1. Validate session & RBAC.
 *  2. Fetch plan price from DB.
 *  3. Guard against duplicate active subscriptions.
 *  4. Create/update StoreSubscription as PENDING_PAYMENT.
 *  5. Call Xendit API.
 *  6. On failure: mark subscription as FAILED, surface error.
 *  7. On success: persist Xendit invoice ID, redirect to invoice URL.
 */
export async function createSubscriptionCheckout(
  planId: string,
  storeId: string
): Promise<never | CheckoutResult> {
  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "You must be signed in to subscribe." }
  }

  // ── 2. RBAC: must be OWNER of this store ─────────────────────────────────
  const membership = await prisma.storeMember.findUnique({
    where: {
      storeId_userId: { storeId, userId: session.user.id },
    },
  })

  if (!membership || membership.role !== "OWNER") {
    return {
      success: false,
      error: "Only the store owner can manage subscriptions.",
    }
  }

  // ── 3. Fetch plan — never trust client price ──────────────────────────────
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    return { success: false, error: "Subscription plan not found." }
  }

  // ── 4. Guard against duplicate active subscriptions ──────────────────────
  const existing = await prisma.storeSubscription.findUnique({
    where: { storeId },
  })

  if (
    existing?.status === "ACTIVE" &&
    existing.currentPeriodEnd > new Date()
  ) {
    return {
      success: false,
      error: `You already have an active ${plan.tier} subscription until ${existing.currentPeriodEnd.toLocaleDateString()}.`,
    }
  }

  // ── 5. Persist a PENDING_PAYMENT subscription record ─────────────────────
  //      Using upsert so a retry after a failed attempt re-uses the same row.
  const periodEnd = new Date()
  if (plan.interval === "YEARLY") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  const externalId = `sub_${storeId}_${planId}`

  const pendingSub = await prisma.storeSubscription.upsert({
    where: { storeId },
    update: {
      planId,
      status: "PENDING_PAYMENT",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      xenditSubscriptionId: null, // clear previous Xendit ref
    },
    create: {
      storeId,
      planId,
      status: "PENDING_PAYMENT",
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    },
  })

  // ── 6. Create Xendit Invoice ──────────────────────────────────────────────
  let invoiceUrl: string

  try {
    const invoice = await xendit.Invoice.createInvoice({
      data: {
        externalId,
        amount: Number(plan.price),
        payerEmail: session.user.email,
        description: `QBS POS — ${plan.tier} Plan (${plan.interval})`,
        currency: plan.currency,
        successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=1`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=payment_failed`,
      },
    })

    invoiceUrl = invoice.invoiceUrl!

    // Persist the Xendit invoice ID so the webhook can correlate later
    await prisma.storeSubscription.update({
      where: { id: pendingSub.id },
      data: { xenditSubscriptionId: invoice.id },
    })
  } catch (err) {
    // Rollback: mark the pending subscription as FAILED so it doesn't linger
    await prisma.storeSubscription.update({
      where: { id: pendingSub.id },
      data: { status: "FAILED" },
    })

    console.error("[createSubscriptionCheckout] Xendit error:", err)
    return {
      success: false,
      error: "Payment gateway error. Please try again or contact support.",
    }
  }

  // ── 7. Redirect to Xendit invoice ─────────────────────────────────────────
  redirect(invoiceUrl)
}

// --------------------------------------------------------------------------
// cancelSubscription
// --------------------------------------------------------------------------

/**
 * Marks a subscription to cancel at the end of the current billing period.
 */
export async function cancelSubscription(
  storeId: string
): Promise<CheckoutResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { success: false, error: "You must be signed in." }
  }

  const membership = await prisma.storeMember.findUnique({
    where: { storeId_userId: { storeId, userId: session.user.id } },
  })

  if (!membership || membership.role !== "OWNER") {
    return {
      success: false,
      error: "Only the store owner can cancel subscriptions.",
    }
  }

  await prisma.storeSubscription.update({
    where: { storeId },
    data: { cancelAtPeriodEnd: true },
  })

  return { success: true, invoiceUrl: "" }
}