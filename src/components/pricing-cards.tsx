"use client"

import { useState, useTransition } from "react"
import { CheckIcon, ZapIcon, BuildingIcon, RocketIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createSubscriptionCheckout } from "@/actions/subscription"

// ---------------------------------------------------------------------------
// Types (serialized from server — Decimal → number)
// ---------------------------------------------------------------------------

export interface SerializedPlan {
  id: string
  tier: "FREE" | "PRO" | "ENTERPRISE"
  price: number
  currency: string
  interval: string
  maxBranches: number
  maxUsers: number
  features: unknown
}

interface PricingCardsProps {
  plans: SerializedPlan[]
  storeId: string | null
  currentPlanTier: string | null
  currentStatus: string
}

// ---------------------------------------------------------------------------
// Tier metadata
// ---------------------------------------------------------------------------

const TIER_META: Record<
  string,
  {
    icon: React.ReactNode
    description: string
    highlighted: boolean
    badge: string | null
  }
> = {
  FREE: {
    icon: <ZapIcon className="size-5" />,
    description: "Perfect for getting started with a single location.",
    highlighted: false,
    badge: null,
  },
  PRO: {
    icon: <RocketIcon className="size-5" />,
    description: "For growing businesses managing multiple branches.",
    highlighted: true,
    badge: "Most Popular",
  },
  ENTERPRISE: {
    icon: <BuildingIcon className="size-5" />,
    description: "Full-scale operations with unlimited team members.",
    highlighted: false,
    badge: "Best Value",
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PricingCards({
  plans,
  storeId,
  currentPlanTier,
  currentStatus,
}: PricingCardsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          storeId={storeId}
          currentPlanTier={currentPlanTier}
          currentStatus={currentStatus}
        />
      ))}
    </div>
  )
}

function PricingCard({
  plan,
  storeId,
  currentPlanTier,
  currentStatus,
}: {
  plan: SerializedPlan
  storeId: string | null
  currentPlanTier: string | null
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  const meta = TIER_META[plan.tier] ?? TIER_META.FREE
  const isCurrentPlan = currentPlanTier === plan.tier
  const isActivePlan = isCurrentPlan && currentStatus === "ACTIVE"

  const features = Array.isArray(plan.features)
    ? (plan.features as string[])
    : typeof plan.features === "object" && plan.features !== null
      ? Object.values(plan.features as Record<string, string>)
      : []

  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.price)

  function handleCheckout() {
    if (!storeId) {
      toast.error("No store found. Please create a store first.")
      return
    }

    startTransition(async () => {
      const result = await createSubscriptionCheckout(plan.id, storeId)
      // If we reach here, the redirect didn't fire (only on error)
      if (result && !result.success) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Card
      className={
        meta.highlighted
          ? "relative ring-2 ring-primary shadow-lg"
          : "relative"
      }
    >
      {meta.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="shadow-sm">{meta.badge}</Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center gap-2 text-primary mb-2">
          {meta.icon}
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {plan.tier}
          </span>
        </div>

        <CardTitle className="text-3xl font-extrabold tabular-nums">
          {formattedPrice}
          <span className="text-base font-normal text-muted-foreground ml-1">
            /{plan.interval === "YEARLY" ? "yr" : "mo"}
          </span>
        </CardTitle>

        <CardDescription>{meta.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Separator />

        <ul className="space-y-2">
          <FeatureItem label={`Up to ${plan.maxBranches} branch(es)`} />
          <FeatureItem label={`Up to ${plan.maxUsers} team member(s)`} />
          {features.map((f, i) => (
            <FeatureItem key={i} label={String(f)} />
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isActivePlan ? (
          <Button variant="outline" className="w-full" disabled>
            <CheckIcon className="size-4" />
            Current Plan
          </Button>
        ) : isCurrentPlan && currentStatus === "PENDING_PAYMENT" ? (
          <Button variant="outline" className="w-full" disabled>
            <Loader2Icon className="size-4 animate-spin" />
            Payment Pending…
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={meta.highlighted ? "default" : "outline"}
            onClick={handleCheckout}
            disabled={isPending || !storeId}
          >
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Redirecting…
              </>
            ) : plan.price === 0 ? (
              "Get Started Free"
            ) : (
              "Subscribe Now"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

function FeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckIcon className="size-4 text-primary shrink-0" />
      <span>{label}</span>
    </li>
  )
}