"use client"

import { useState, useSyncExternalStore, type MouseEventHandler, type ReactNode } from "react"
import { ArrowUpRight, Menu, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import { useAppLocale } from "@/app/providers"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export type Tone = "success" | "warning" | "info" | "danger" | "neutral"

export function BrandLogo() {
  return (
    <span className="brand-wordmark" aria-label="HFI">
      hfi<span aria-hidden="true">.</span>
    </span>
  )
}

export function ActionButton({
  children,
  icon,
  endContent,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
  type = "button",
  className,
  ariaLabel,
  href,
  target,
  rel,
}: {
  children: ReactNode
  icon?: ReactNode
  endContent?: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
  onClick?: MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  type?: "button" | "submit" | "reset"
  className?: string
  ariaLabel?: string
  href?: string
  target?: string
  rel?: string
}) {
  const content = (
    <>
      {icon}
      {children}
      {endContent}
    </>
  )
  const props = {
    variant: variant === "primary" ? ("default" as const) : variant,
    size: size === "md" ? ("default" as const) : size,
    className: cn("action-button", className),
    "aria-label": ariaLabel,
  }
  if (href && !disabled)
    return (
      <Button {...props} asChild>
        <Link href={href} target={target} rel={rel}>
          {content}
        </Link>
      </Button>
    )
  return (
    <Button {...props} type={type} disabled={disabled} onClick={onClick}>
      {content}
    </Button>
  )
}

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn("surface", className)}>{children}</Card>
}

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <Badge variant="secondary" className={cn("status-badge", `status-badge--${tone}`)}>
      {children}
    </Badge>
  )
}

const subscribe = () => () => undefined

export function NeoHeader({ home = false }: { home?: boolean }) {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const neo = useTranslations("neo.nav")
  const { locale, setLocale } = useAppLocale()
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const [open, setOpen] = useState(false)
  const zh = locale === "zh-CN"
  const items = [
    { href: "/reservation/create", label: t("book") },
    { href: "/reservation/search", label: t("reservations") },
    { href: "/dashboard", label: zh ? "场地看板" : "Live schedule" },
    { href: "/admin/reservation", label: t("admin") },
  ]
  const preferences = (
    <>
      <Button
        variant="ghost"
        onClick={() => setLocale(zh ? "en-US" : "zh-CN")}
        aria-label={t("switchLanguage")}
      >
        {zh ? "EN" : "中文"}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label={t("theme")}
      >
        {mounted && resolvedTheme === "dark" ? <Sun /> : <Moon />}
      </Button>
    </>
  )
  const links = items.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      aria-current={pathname.startsWith(href) ? "page" : undefined}
    >
      {label}
    </Link>
  ))
  return (
    <header className={cn("utility-header", home && "utility-header--home")}>
      <a className="skip-link" href="#main-content">
        {zh ? "跳到主要内容" : "Skip to content"}
      </a>
      <Link href="/" className="utility-brand" aria-label={neo("returnHome")}>
        <BrandLogo />
        <span>
          Utility
          <br />
          Center
        </span>
      </Link>
      <nav className="utility-nav" aria-label={zh ? "主导航" : "Main navigation"}>
        {links}
      </nav>
      <div className="utility-preferences">{preferences}</div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="utility-menu" aria-label={neo("openMenu")}>
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent className="utility-mobile-menu">
          <SheetHeader>
            <SheetTitle>{t("menu")}</SheetTitle>
          </SheetHeader>
          <nav aria-label={zh ? "移动导航" : "Mobile navigation"}>
            <Link href="/" onClick={() => setOpen(false)}>
              {t("home")}
            </Link>
            {links}
          </nav>
          <div className="flex gap-2 px-6">{preferences}</div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

export function NeoFooter() {
  const { locale } = useAppLocale()
  return (
    <footer className="utility-footer">
      <span>HFI Utility Center</span>
      <a href="https://hfi.one" target="_blank" rel="noreferrer">
        {locale === "zh-CN" ? "更多校园工具" : "More campus tools"}
        <ArrowUpRight size={16} />
      </a>
    </footer>
  )
}

export function NeoPage({ children }: { children: ReactNode }) {
  return (
    <div className="app-page app-page--light">
      <NeoHeader />
      {children}
    </div>
  )
}
