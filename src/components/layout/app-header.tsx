"use client"

import { useState, useSyncExternalStore, type ReactNode } from "react"
import { Languages, Menu, Moon, Sun } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Toggle } from "@/components/ui/toggle"
import { useAppLocale, type AppLocale } from "@/lib/locale"
import { cn } from "@/lib/utils"

const LOCALE_LABELS: { locale: AppLocale; label: string }[] = [
  { locale: "zh-CN", label: "中文" },
  { locale: "en-US", label: "English" },
]

// Stable no-op subscription: the mounted flag only needs to be sampled once,
// never observed. Inlined below because `useSyncExternalStore` requires a
// referentially stable function across renders.
const subscribe = () => () => undefined

const NAV = [
  { href: "/", labelKey: "home", match: "/" },
  { href: "/reservation/create", labelKey: "book", match: "/reservation/create" },
  { href: "/reservation/search", labelKey: "reservations", match: "/reservation" },
  { href: "/dashboard", labelKey: "liveSchedule", match: "/dashboard" },
  { href: "/admin/reservation", labelKey: "admin", match: "/admin" },
] as const

// One active signal only: the `after:` underline. The previous `bg-accent` chip
// doubled it up and made every nav row read as a toggle.
const linkClasses = (active: boolean) =>
  cn(
    "relative rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
    "text-muted-foreground hover:text-foreground",
    "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity hover:after:opacity-40",
    active && "text-foreground after:opacity-100",
  )

export function AppHeader({ actions }: { actions?: ReactNode }) {
  const pathname = usePathname()
  const nav = useTranslations("nav")
  const t = useTranslations("layout")
  const { locale, setLocale } = useAppLocale()
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const [open, setOpen] = useState(false)

  // `NAV` is ordered most-specific-first, so the first match wins and a deeper
  // route (`/reservation/create`) never lights up its ancestor (`/reservation`)
  // as well.
  const activeHref = NAV.find((item) =>
    item.match === "/"
      ? pathname === "/"
      : pathname === item.match || pathname.startsWith(`${item.match}/`),
  )?.href

  const items = NAV.map((item) => ({
    href: item.href,
    label: item.labelKey === "liveSchedule" ? t("liveSchedule") : nav(item.labelKey),
    active: item.href === activeHref,
  }))

  const isDark = mounted && resolvedTheme === "dark"

  const localeControl = (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={nav("language")}
              className="size-11 shrink-0"
            >
              <Languages aria-hidden />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{nav("language")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>{nav("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALE_LABELS.map(({ locale: value, label }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setLocale(value)}
            className={cn("justify-between gap-4", value === locale && "font-semibold")}
            aria-checked={value === locale}
          >
            {label}
            {value === locale ? <span aria-hidden>✓</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Both header utilities are momentary actions, so both are borderless ghost
  // controls of the same size. The installed `toggle.tsx` ships only `default`
  // (borderless) and `outline` (`border border-input`) — there is no `ghost`
  // variant — so `default` is the borderless one. `default` and `outline` also
  // differ in hover, so the className below mirrors the locale Button's ghost
  // treatment. The pressed fill is neutralised because a theme switch is a
  // momentary action, not a two-state toggle: left alone, Radix flips
  // `aria-pressed` on click and the button keeps a filled background.
  const themeControl = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          type="button"
          variant="default"
          size="default"
          className="size-11 shrink-0 border border-transparent hover:bg-muted hover:text-foreground aria-pressed:bg-transparent data-[state=on]:bg-transparent"
          aria-label={nav("theme")}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>{nav("theme")}</TooltipContent>
    </Tooltip>
  )

  return (
    <TooltipProvider delayDuration={80}>
      <header className="sticky top-0 z-50 h-14 border-b bg-background/80 backdrop-blur-md">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:h-auto focus:w-auto focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
        >
          {t("skipToContent")}
        </a>
        <div className="mx-auto flex h-14 w-full max-w-7xl min-w-0 items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            prefetch={false}
            className="flex shrink-0 items-center gap-2 rounded-md text-base font-semibold tracking-tight"
          >
            <span>hfi</span>
            <span className="hidden text-sm font-normal text-muted-foreground lg:inline">
              Utility Center
            </span>
            <span className="sr-only lg:hidden">Utility Center</span>
          </Link>

          <nav aria-label={t("mainNav")} className="ml-4 hidden min-w-0 md:flex md:items-center">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                aria-current={item.active ? "page" : undefined}
                className={linkClasses(item.active)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1">
            {actions}
            <div className="hidden sm:contents">{localeControl}</div>
            {themeControl}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0 md:hidden"
                  aria-label={t("openMenu")}
                >
                  <Menu aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(20rem,88vw)] gap-0 p-0">
                <SheetHeader className="border-b">
                  <SheetTitle>{t("mobileNav")}</SheetTitle>
                  <div className="mt-2 flex items-center gap-1">
                    {localeControl}
                    {themeControl}
                  </div>
                </SheetHeader>
                <nav aria-label={t("mobileNav")} className="flex min-w-0 flex-col gap-1 p-4">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      aria-current={item.active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(linkClasses(item.active), "py-3 text-base")}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
