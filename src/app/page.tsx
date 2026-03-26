"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Store, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LightRays from "@/components/LightRays";

export default function Home() {
  const router = useRouter();
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden px-6">
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
      <div className="relative z-10 max-w-3xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Store size={40} strokeWidth={2.5} />
          </div>
          <h1 className="scroll-m-20 text-5xl font-extrabold tracking-tight lg:text-7xl">
            QBS <span className="text-primary">POS</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="h-12 px-8 text-md font-semibold gap-2 transition-all" onClick={() => router.push("/dashboard")}>
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-md">
            View Tutorial
          </Button>
        </div>
        <div className="pt-12 border-t border-border/40 mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Made by <Link href="https://ucyenyen.dev" target="_blank" className="text-primary font-bold">Bryan Fernando Dinata</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
