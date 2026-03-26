import { usePathname } from "next/navigation"

export function useActiveNavUrl() {
  const pathname = usePathname()
  return pathname
}
