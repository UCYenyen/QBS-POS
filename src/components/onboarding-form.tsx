"use client"

import { useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Store, GitBranch, Loader2, ArrowRight, Sparkles } from "lucide-react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  createFreeStoreAction,
  createFreeStoreSchema,
  type CreateFreeStoreInput,
} from "@/actions/onboarding"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface OnboardingFormProps {
  userName: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingForm({ userName }: OnboardingFormProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateFreeStoreInput>({
    resolver: zodResolver(createFreeStoreSchema),
    defaultValues: {
      storeName: "",
      branchName: "Main Branch",
    },
  })

  function onSubmit(values: CreateFreeStoreInput) {
    startTransition(async () => {
      const result = await createFreeStoreAction(values)

      // If result is returned (vs. redirect()), it's always an error
      if (result && !result.success) {
        toast.error(result.error)

        // Surface per-field validation errors from the server
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof CreateFreeStoreInput, {
              message: messages[0],
            })
          }
        }
      }
    })
  }

  const firstName = userName.split(" ")[0]

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        {/* Icon mark */}
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Store className="size-6" strokeWidth={2.5} />
        </div>

        <CardTitle className="text-2xl font-extrabold tracking-tight">
          Welcome, {firstName}! 👋
        </CardTitle>

        <CardDescription className="mt-1 text-sm">
          You&apos;re just a few seconds away from launching your store.
          Let&apos;s set it up.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <span>
            Starting on the <strong className="text-foreground">Free Plan</strong> — upgrade anytime from your dashboard.
          </span>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Store Name */}
          <Controller
            control={form.control}
            name="storeName"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error || undefined}>
                <FieldLabel className="flex items-center gap-1.5" htmlFor="storeName">
                  <Store className="size-3.5 text-muted-foreground" />
                  Store Name
                </FieldLabel>
                <Input
                  id="storeName"
                  placeholder="e.g. Toko Maju Jaya"
                  autoComplete="organization"
                  autoFocus
                  disabled={isPending}
                  {...field}
                />
                <FieldDescription>
                  This is the name of your business as it appears in QBS POS.
                </FieldDescription>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          {/* Branch Name */}
          <Controller
            control={form.control}
            name="branchName"
            render={({ field, fieldState }) => (
              <Field data-invalid={!!fieldState.error || undefined}>
                <FieldLabel className="flex items-center gap-1.5" htmlFor="branchName">
                  <GitBranch className="size-3.5 text-muted-foreground" />
                  First Branch Name
                </FieldLabel>
                <Input
                  id="branchName"
                  placeholder="e.g. Main Branch"
                  disabled={isPending}
                  {...field}
                />
                <FieldDescription>
                  Your first physical location or point-of-sale terminal.
                </FieldDescription>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          <Button
            type="submit"
            className="w-full h-10 font-semibold gap-2"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating your store…
              </>
            ) : (
              <>
                Launch My Store
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}