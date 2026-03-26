import { prisma } from "@/lib/prisma"

export type SubscriptionFeature = "BRANCHES" | "USERS"

export class SubscriptionLimitError extends Error {
  constructor(
    message: string,
    public readonly feature: SubscriptionFeature,
    public readonly currentUsage: number,
    public readonly limit: number,
    public readonly planTier: string
  ) {
    super(message)
    this.name = "SubscriptionLimitError"
  }
}

export class NoActiveSubscriptionError extends Error {
  constructor() {
    super("No active subscription found. Please subscribe to a plan to continue.")
    this.name = "NoActiveSubscriptionError"
  }
}

/**
 * Verifies that a store's current usage does not exceed its plan limits.
 *
 * @throws {NoActiveSubscriptionError} If no active subscription exists for the store.
 * @throws {SubscriptionLimitError}    If the feature limit has been reached.
 */
export async function verifySubscriptionLimits(
  storeId: string,
  requiredFeature: SubscriptionFeature
): Promise<true> {
  const subscription = await prisma.storeSubscription.findUnique({
    where: { storeId },
    include: { plan: true },
  })

  const isActive =
    subscription?.status === "ACTIVE" &&
    subscription.currentPeriodEnd > new Date()

  if (!subscription || !isActive) {
    throw new NoActiveSubscriptionError()
  }

  const { plan } = subscription

  if (requiredFeature === "BRANCHES") {
    const branchCount = await prisma.storeBranch.count({ where: { storeId } })

    if (branchCount >= plan.maxBranches) {
      throw new SubscriptionLimitError(
        `Your ${plan.tier} plan allows a maximum of ${plan.maxBranches} branch(es). ` +
          `You currently have ${branchCount}. Please upgrade your plan to add more.`,
        "BRANCHES",
        branchCount,
        plan.maxBranches,
        plan.tier
      )
    }
  }

  if (requiredFeature === "USERS") {
    const memberCount = await prisma.storeMember.count({ where: { storeId } })

    if (memberCount >= plan.maxUsers) {
      throw new SubscriptionLimitError(
        `Your ${plan.tier} plan allows a maximum of ${plan.maxUsers} user(s). ` +
          `You currently have ${memberCount}. Please upgrade your plan to add more.`,
        "USERS",
        memberCount,
        plan.maxUsers,
        plan.tier
      )
    }
  }

  return true
}

/**
 * Returns the current subscription status for a store.
 * Safe to use in UI rendering — never throws.
 */
export async function getSubscriptionStatus(storeId: string) {
  const subscription = await prisma.storeSubscription.findUnique({
    where: { storeId },
    include: { plan: true },
  })

  if (!subscription) return { status: "NONE" as const, subscription: null }

  const isExpired =
    subscription.status === "ACTIVE" &&
    subscription.currentPeriodEnd <= new Date()

  return {
    status: isExpired ? ("EXPIRED" as const) : subscription.status,
    subscription,
  }
}