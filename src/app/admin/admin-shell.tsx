"use client"

import {
  Building2,
  CalendarClock,
  CalendarPlus,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { AppFrame } from "@/components/layout/app-shell"
import { AppHeader } from "@/components/layout/app-header"
import { LoadingState } from "@/components/layout/data-state"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAdminSession } from "@/lib/api/admin-hooks"
import { logout } from "@/lib/api/auth"

const NAVIGATION = [
  { href: "/admin", labelKey: "overview", icon: LayoutDashboard },
  { href: "/admin/reservation", labelKey: "reservations", icon: CalendarClock },
  { href: "/admin/force-reservation", labelKey: "forceReservationTab", icon: CalendarPlus },
  { href: "/admin/facility", labelKey: "facilities", icon: Building2 },
  { href: "/admin/announcement", labelKey: "announcements", icon: Megaphone },
  { href: "/admin/user", labelKey: "users", icon: Users },
] as const

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      {pathname === "/admin/login" ? (
        children
      ) : (
        <AuthenticatedAdminShell pathname={pathname}>{children}</AuthenticatedAdminShell>
      )}
    </TooltipProvider>
  )
}

function AuthenticatedAdminShell({
  pathname,
  children,
}: {
  pathname: string
  children: React.ReactNode
}) {
  const t = useTranslations("admin")
  const layout = useTranslations("layout")
  const router = useRouter()
  const session = useAdminSession(pathname)
  const navigationItems = NAVIGATION.map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    icon: item.icon,
    active: item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
  }))

  async function signOut() {
    try {
      await logout()
    } finally {
      router.replace("/admin/login")
    }
  }

  if (!session.checking && !session.authenticated) return null

  return (
    <SidebarProvider className="flex-col">
      <AppHeader
        actions={
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarTrigger aria-label={t("toggleSidebar")} />
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("toggleSidebar")}</TooltipContent>
          </Tooltip>
        }
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsible="icon" className="top-14! h-[calc(100svh-3.5rem)]!">
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <Building2 aria-hidden className="size-5 shrink-0 text-primary" />
              <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold">{t("workspace")}</span>
                <span className="truncate text-xs text-muted-foreground">{layout("brand")}</span>
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t("navGroupManagement")}</SidebarGroupLabel>
              <SidebarGroupContent>
                {session.checking ? (
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuSkeleton showIcon />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                ) : (
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.active}
                          tooltip={item.label}
                          className="h-9 data-[collapsible=icon]:h-8!"
                        >
                          <Link href={item.href} aria-current={item.active ? "page" : undefined}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => void signOut()}
                  tooltip={t("logout")}
                  className="h-9 data-[collapsible=icon]:h-8!"
                >
                  <LogOut />
                  <span className="sr-only">{t("logout")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0">
          <AppFrame width="wide">
            {session.checking ? <LoadingState label={t("checking")} rows={4} /> : children}
          </AppFrame>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
