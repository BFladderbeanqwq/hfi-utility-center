"use client"

import { usePathname } from "next/navigation"

import { NeoHeader } from "@/components/neo/shared"

export function Navbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === "/admin/login")
    return (
      <>
        <NeoHeader />
        {children}
      </>
    )

  if (!pathname.startsWith("/admin")) {
    return <>{children}</>
  }

  return (
    <div className="admin-app-shell">
      <NeoHeader />
      <div className="min-h-[calc(100svh-94px)]">{children}</div>
    </div>
  )
}
