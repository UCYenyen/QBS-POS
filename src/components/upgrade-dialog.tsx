"use client"

import { useState } from "react"
import { ArrowUpCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PricingCards, type SerializedPlan } from "@/components/pricing-cards"

interface UpgradeDialogProps {
  plans: SerializedPlan[]
  storeId: string
  currentPlanTier: string
}

export function UpgradeDialog({ plans, storeId, currentPlanTier }: UpgradeDialogProps) {
  const [open, setOpen] = useState(false)

  // Only show paid plans in the upgrade dialog
  const upgradablePlans = plans.filter((p) => p.price > 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <ArrowUpCircleIcon className="size-4" />
          Upgrade Plan
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            You&apos;re currently on the{" "}
            <strong className="text-foreground">{currentPlanTier}</strong> plan.
            Choose a paid plan below to unlock more branches and team members.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <PricingCards
            plans={upgradablePlans}
            storeId={storeId}
            currentPlanTier={currentPlanTier}
            currentStatus="ACTIVE"
            isAuthenticated={true}
            paidOnly={true}
          />
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          Payments are processed securely via Xendit. You can cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  )
}