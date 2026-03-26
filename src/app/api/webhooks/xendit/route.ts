import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Xendit Webhook POST /api/webhooks/xendit
// ---------------------------------------------------------------------------
//
// Security:
//   Xendit sends a "x-callback-token" header with every webhook call.
//   We compare it against XENDIT_WEBHOOK_TOKEN stored in our environment.
//   Requests that fail this check are rejected with 401.
//
// Supported events: PAID (Invoice settled)
// ---------------------------------------------------------------------------

interface XenditInvoicePayload {
  id: string
  external_id: string
  status: "PAID" | "EXPIRED" | "PENDING"
  payment_method?: string
  paid_amount?: number
  paid_at?: string
  currency?: string
  amount: number
  payer_email?: string
}

export async function POST(request: NextRequest) {
  // ── 1. Validate callback token ──────────────────────────────────────────
  const callbackToken = request.headers.get("x-callback-token")
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN

  if (!expectedToken || callbackToken !== expectedToken) {
    console.warn("[xendit-webhook] Invalid or missing callback token")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── 2. Parse payload ────────────────────────────────────────────────────
  let payload: XenditInvoicePayload

  try {
    payload = (await request.json()) as XenditInvoicePayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const { external_id, status, id: xenditInvoiceId } = payload

  // ── 3. Only process PAID events ─────────────────────────────────────────
  if (status !== "PAID") {
    // Acknowledge non-PAID events gracefully (e.g., EXPIRED)
    if (status === "EXPIRED") {
      await handleExpiredInvoice(external_id)
    }
    return NextResponse.json({ received: true })
  }

  // ── 4. Parse external_id to extract storeId & planId ────────────────────
  //      Format: "sub_{storeId}_{planId}"
  const parsed = parseExternalId(external_id)

  if (!parsed) {
    console.error("[xendit-webhook] Could not parse external_id:", external_id)
    return NextResponse.json(
      { error: "Unrecognized external_id format" },
      { status: 400 }
    )
  }

  const { storeId, planId } = parsed

  // ── 5. Fetch the plan to calculate period end ────────────────────────────
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    console.error("[xendit-webhook] Plan not found:", planId)
    return NextResponse.json({ error: "Plan not found" }, { status: 404 })
  }

  // ── 6. Activate the subscription ─────────────────────────────────────────
  const now = new Date()
  const periodEnd = new Date(now)

  if (plan.interval === "YEARLY") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    // Default: MONTHLY
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  try {
    await prisma.storeSubscription.update({
      where: { storeId },
      data: {
        planId,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        xenditSubscriptionId: xenditInvoiceId,
        cancelAtPeriodEnd: false,
      },
    })

    console.info(
      `[xendit-webhook] Activated subscription for store ${storeId} → plan ${plan.tier}`
    )
  } catch (err) {
    console.error("[xendit-webhook] Failed to update subscription:", err)
    // Return 500 so Xendit retries the webhook
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true, activated: true })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseExternalId(
  externalId: string
): { storeId: string; planId: string } | null {
  // Format: "sub_{storeId}_{planId}"
  // UUIDs contain hyphens, so we split on the first two underscores only.
  const prefix = "sub_"
  if (!externalId.startsWith(prefix)) return null

  const withoutPrefix = externalId.slice(prefix.length)
  // storeId is a UUID (36 chars), then underscore, then planId
  const uuidLength = 36
  if (withoutPrefix.length < uuidLength + 1 + 1) return null

  const storeId = withoutPrefix.slice(0, uuidLength)
  const planId = withoutPrefix.slice(uuidLength + 1) // +1 for the underscore

  if (!storeId || !planId) return null

  return { storeId, planId }
}

async function handleExpiredInvoice(externalId: string) {
  const parsed = parseExternalId(externalId)
  if (!parsed) return

  try {
    // Only update if still pending — don't overwrite an already-active sub
    await prisma.storeSubscription.updateMany({
      where: {
        storeId: parsed.storeId,
        status: "PENDING_PAYMENT",
      },
      data: { status: "EXPIRED" },
    })
  } catch (err) {
    console.error("[xendit-webhook] Failed to mark expired subscription:", err)
  }
}