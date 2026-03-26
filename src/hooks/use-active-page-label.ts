'use client'
import { usePathname } from "next/navigation"

export function useActivePageLabel() {
  const pathname = usePathname()
  // Map routes to labels
  switch (pathname) {
    case "/dashboard":
      return "Dashboard"
    case "/signin":
      return "signin"
    case "/signup":
      return "Signup"
    case "/reports":
      return "Reports"
    case "/assistant":
      return "AI Assistant"
    case "/products":
      return "Products"
    case "/customers":
      return "Customers"
    default:
      return "Documents"
  }
}
