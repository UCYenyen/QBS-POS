import { headers } from "next/headers"
import { SparklesIcon } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PricingCards, type SerializedPlan } from "@/components/pricing-cards"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// ---------------------------------------------------------------------------
// Pricing Page — Server Component
// ---------------------------------------------------------------------------

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; subscribed?: string }>
}) {
  const params = await searchParams

  // ── Authenticate ──────────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: await headers() })

  // ── Fetch all plans ordered by price ─────────────────────────────────────
  const rawPlans = await prisma.subscriptionPlan.findMany({
    orderBy: { price: "asc" },
  })

  // Serialize Decimal → number (safe to pass to Client Components)
  const plans: SerializedPlan[] = rawPlans.map((p) => ({
    id: p.id,
    tier: p.tier as SerializedPlan["tier"],
    price: Number(p.price),
    currency: p.currency,
    interval: p.interval,
    maxBranches: p.maxBranches,
    maxUsers: p.maxUsers,
    features: p.features,
  }))

  // ── Find the user's owned store + current subscription ───────────────────
  let storeId: string | null = null
  let currentPlanTier: string | null = null
  let currentStatus = "NONE"

  if (session?.user) {
    const ownerMembership = await prisma.storeMember.findFirst({
      where: { userId: session.user.id, role: "OWNER" },
      include: {
        store: {
          include: { subscription: { include: { plan: true } } },
        },
      },
    })

    if (ownerMembership) {
      storeId = ownerMembership.storeId
      const sub = ownerMembership.store.subscription

      if (sub) {
        currentStatus = sub.status
        currentPlanTier = sub.plan.tier

        // Mark as expired if the period has lapsed
        if (sub.status === "ACTIVE" && sub.currentPeriodEnd <= new Date()) {
          currentStatus = "EXPIRED"
        }
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 py-4 px-4 md:gap-10 md:py-6 lg:px-6">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center p-2 rounded-xl bg-primary/10 text-primary mb-2">
              <SparklesIcon className="size-6" />
            </div>
            <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
              Simple, Transparent Pricing
            </h1>
            <p className="text-muted-foreground text-base">
              Choose the plan that fits your business. Upgrade or downgrade at
              any time.
            </p>
          </div>

          {/* ── Alerts ─────────────────────────────────────────────────── */}
          {params.subscribed && (
            <Alert>
              <SparklesIcon className="size-4" />
              <AlertTitle>Subscription Activated!</AlertTitle>
              <AlertDescription>
                Welcome aboard. Your plan is now active and your store is ready
                to use.
              </AlertDescription>
            </Alert>
          )}

          {params.error === "payment_failed" && (
            <Alert variant="destructive">
              <AlertTitle>Payment Failed</AlertTitle>
              <AlertDescription>
                Your payment was not completed. Please try again or contact
                support if the issue persists.
              </AlertDescription>
            </Alert>
          )}

          {!storeId && session?.user && (
            <Alert>
              <AlertTitle>No Store Found</AlertTitle>
              <AlertDescription>
                You don&apos;t have a store yet. Create one first before
                subscribing to a plan.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Subscription status banner ─────────────────────────────── */}
          {currentStatus === "ACTIVE" && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                Active subscription: {currentPlanTier} plan
              </span>
            </div>
          )}

          {currentStatus === "EXPIRED" && (
            <Alert variant="destructive">
              <AlertTitle>Subscription Expired</AlertTitle>
              <AlertDescription>
                Your subscription has expired. Please renew to continue using
                all features.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Pricing Cards ───────────────────────────────────────────── */}
          {plans.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No subscription plans are configured yet.
            </div>
          ) : (
            <PricingCards
              plans={plans}
              storeId={storeId}
              currentPlanTier={currentPlanTier}
              currentStatus={currentStatus}
            />
          )}

          {/* ── Footer note ────────────────────────────────────────────── */}
          <p className="text-center text-xs text-muted-foreground pb-4">
            All prices are in IDR and exclusive of applicable taxes. Payments
            are processed securely by Xendit.
          </p>

        </div>
      </div>
    </div>
  )
}