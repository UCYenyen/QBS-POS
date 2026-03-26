import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CalendarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  BuildingIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import type { SerializedPlan } from "@/components/pricing-cards"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
        <ClockIcon className="size-3 mr-1" />
        Cancels at period end
      </Badge>
    )
  }
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
          <CheckCircle2Icon className="size-3 mr-1" />
          Active
        </Badge>
      )
    case "TRIAL":
      return <Badge variant="secondary">Trial</Badge>
    case "EXPIRED":
      return <Badge variant="destructive">Expired</Badge>
    case "PENDING_PAYMENT":
      return <Badge variant="outline">Pending Payment</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/signin")

  // Fetch the user's owned store with subscription and plan
  const membership = await prisma.storeMember.findFirst({
    where: { userId: session.user.id, role: "OWNER" },
    include: {
      store: {
        include: {
          subscription: { include: { plan: true } },
          branches: { select: { id: true } },
          members: { select: { id: true } },
        },
      },
    },
  })

  // Fetch all plans for the upgrade dialog
  const rawPlans = await prisma.subscriptionPlan.findMany({
    orderBy: { price: "asc" },
  })

  const allPlans: SerializedPlan[] = rawPlans.map((p) => ({
    id: p.id,
    tier: p.tier as SerializedPlan["tier"],
    price: Number(p.price),
    currency: p.currency,
    interval: p.interval,
    maxBranches: p.maxBranches,
    maxUsers: p.maxUsers,
    features: p.features,
  }))

  const store = membership?.store ?? null
  const sub = store?.subscription ?? null
  const plan = sub?.plan ?? null

  const branchCount = store?.branches.length ?? 0
  const memberCount = store?.members.length ?? 0

  const isExpired = sub?.status === "ACTIVE" && sub.currentPeriodEnd
    ? sub.currentPeriodEnd <= new Date()
    : false

  const effectiveStatus = isExpired ? "EXPIRED" : (sub?.status ?? "NONE")

  const canUpgrade =
    store &&
    sub &&
    (plan?.tier === "FREE" || effectiveStatus === "EXPIRED")

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 py-4 px-4 md:py-6 lg:px-6 max-w-4xl">

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your store configuration and billing.
            </p>
          </div>

          <Tabs defaultValue="billing">
            <TabsList>
              <TabsTrigger value="billing">
                <CreditCardIcon className="size-4 mr-1.5" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="store">
                <BuildingIcon className="size-4 mr-1.5" />
                Store
              </TabsTrigger>
            </TabsList>

            {/* ── Billing Tab ─────────────────────────────────────────────── */}
            <TabsContent value="billing" className="mt-6 space-y-6">

              {!store && (
                <Alert>
                  <AlertTriangleIcon className="size-4" />
                  <AlertTitle>No store found</AlertTitle>
                  <AlertDescription>
                    You haven&apos;t set up a store yet.{" "}
                    <a href="/onboarding" className="underline font-medium">
                      Create one now
                    </a>{" "}
                    to get started.
                  </AlertDescription>
                </Alert>
              )}

              {effectiveStatus === "EXPIRED" && (
                <Alert variant="destructive">
                  <AlertTriangleIcon className="size-4" />
                  <AlertTitle>Subscription Expired</AlertTitle>
                  <AlertDescription>
                    Your subscription ended on{" "}
                    {sub?.currentPeriodEnd?.toLocaleDateString()}. Renew below
                    to restore full access.
                  </AlertDescription>
                </Alert>
              )}

              {/* Current plan card */}
              {store && plan && sub && (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <ShieldCheckIcon className="size-5 text-primary" />
                          Current Plan
                        </CardTitle>
                        <CardDescription>
                          Your subscription details for{" "}
                          <strong className="text-foreground">{store.name}</strong>
                        </CardDescription>
                      </div>
                      {statusBadge(effectiveStatus, sub.cancelAtPeriodEnd)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <span className="text-sm font-semibold">
                        {plan.tier} — {plan.interval}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {plan.price.toString() === "0"
                          ? "Free forever"
                          : new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: plan.currency,
                              maximumFractionDigits: 0,
                            }).format(Number(plan.price)) +
                            `/${plan.interval === "YEARLY" ? "yr" : "mo"}`}
                      </span>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      {/* Branches usage */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BuildingIcon className="size-3.5" />
                          Branches
                        </div>
                        <p className="text-sm font-semibold tabular-nums">
                          {branchCount}{" "}
                          <span className="text-muted-foreground font-normal">
                            / {plan.maxBranches}
                          </span>
                        </p>
                        {branchCount >= plan.maxBranches && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangleIcon className="size-3" />
                            Limit reached
                          </p>
                        )}
                      </div>

                      {/* Members usage */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UsersIcon className="size-3.5" />
                          Team members
                        </div>
                        <p className="text-sm font-semibold tabular-nums">
                          {memberCount}{" "}
                          <span className="text-muted-foreground font-normal">
                            / {plan.maxUsers}
                          </span>
                        </p>
                        {memberCount >= plan.maxUsers && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <AlertTriangleIcon className="size-3" />
                            Limit reached
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Billing period */}
                    {sub.currentPeriodEnd &&
                      plan.price.toString() !== "0" && (
                        <>
                          <Separator />
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarIcon className="size-3.5 shrink-0" />
                            <span>
                              Current period:{" "}
                              <strong className="text-foreground">
                                {sub.currentPeriodStart.toLocaleDateString()}
                              </strong>{" "}
                              →{" "}
                              <strong className="text-foreground">
                                {sub.currentPeriodEnd.toLocaleDateString()}
                              </strong>
                            </span>
                          </div>
                        </>
                      )}
                  </CardContent>

                  {/* Upgrade CTA */}
                  {canUpgrade && (
                    <CardFooter className="border-t pt-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
                        <p className="text-sm text-muted-foreground">
                          Unlock more branches and team members with a paid plan.
                        </p>
                        <UpgradeDialog
                          plans={allPlans}
                          storeId={store.id}
                          currentPlanTier={plan.tier}
                        />
                      </div>
                    </CardFooter>
                  )}
                </Card>
              )}

              {/* No subscription yet */}
              {store && !sub && (
                <Card>
                  <CardHeader>
                    <CardTitle>No Subscription</CardTitle>
                    <CardDescription>
                      Your store doesn&apos;t have an active plan.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <UpgradeDialog
                      plans={allPlans}
                      storeId={store.id}
                      currentPlanTier="NONE"
                    />
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            {/* ── Store Tab ───────────────────────────────────────────────── */}
            <TabsContent value="store" className="mt-6">
              {store ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Store Details</CardTitle>
                    <CardDescription>
                      Basic information about your store.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Name</span>
                      <span className="text-sm font-medium">{store.name}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Store ID</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {store.id}
                      </code>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Role</span>
                      <Badge variant="secondary">OWNER</Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <AlertTitle>No store configured</AlertTitle>
                  <AlertDescription>
                    <a href="/onboarding" className="underline">
                      Create your store
                    </a>{" "}
                    to see store settings here.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}