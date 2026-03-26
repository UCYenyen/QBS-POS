import { SignupForm } from "@/components/signup-form"
import LightRays from "@/components/LightRays"

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#846feb"
          raysSpeed={0.25}
          lightSpread={1}
          rayLength={10}
          followMouse={true}
          mouseInfluence={0.05}
          noiseAmount={0.5}
          distortion={0.1}
          className="custom-rays"
          pulsating={true}
          fadeDistance={1}
          saturation={1}
        />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <SignupForm />
      </div>
    </div>
  )
}
