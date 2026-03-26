"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, signUp } from "@/lib/auth-client"
import { toast } from "sonner"

export function useSignInForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    await signIn.email(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Signed in successfully!")
          router.push("/dashboard")
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to sign in. Please check your credentials.")
        },
      }
    )

    setLoading(false)
  }

  return { loading, handleSubmit }
}

export function useSignUpForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirm-password") as string

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.")
      setLoading(false)
      return
    }

    await signUp.email(
      { name, email, password },
      {
        onSuccess: () => {
          toast.success("Account created successfully!")
          router.push("/dashboard")
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to create account. Please try again.")
        },
      }
    )

    setLoading(false)
  }

  return { loading, handleSubmit }
}
