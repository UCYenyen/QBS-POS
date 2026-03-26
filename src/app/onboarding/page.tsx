import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import LightRays from "@/components/LightRays"
import { OnboardingForm } from "@/components/onboarding-form"

// ---------------------------------------------------------------------------
// Security Guard (Server Component)
// ---------------------------------------------------------------------------

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  // Not logged in → go sign in first, then come back
  if (!session?.user) {
    redirect("/signin?callbackUrl=/onboarding")
  }

  // Already owns a store → no need for onboarding
  const existingStore = await prisma.storeMember.findFirst({
    where: { userId: session.user.id, role: "OWNER" },
  })

  if (existingStore) {
    redirect("/dashboard")
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 md:p-10 overflow-hidden">
      {/* Background effect */}
      <div className="absolute inset-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#846feb"
          raysSpeed={0.2}
          lightSpread={0.8}
          rayLength={8}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0.3}
          distortion={0.05}
          pulsating={true}
          fadeDistance={1}
          saturation={0.8}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <OnboardingForm userName={session.user.name} />
      </div>
    </div>
  )
}