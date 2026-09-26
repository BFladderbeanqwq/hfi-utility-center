"use client"

import { useEffect, useState } from "react"
import { LayoutDashboard, ListChecks, Maximize2, Megaphone, Plus } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { AppShell } from "@/components/layout/app-shell"
import { MarkdownContent } from "@/components/markdown-content"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getCurrentAnnouncement } from "@/lib/api/announcements"
import type { Announcement } from "@/lib/api/types"

// A closed set of three: the destinations reachable without leaving the
// utility center. The tiles carry no description on purpose — the icon and the
// label are the whole affordance, and the search page owns keyword search.
const LAUNCHER = [
  { href: "/reservation/create", labelKey: "bookAction", icon: Plus },
  { href: "/reservation/search", labelKey: "searchTitle", icon: ListChecks },
  { href: "/dashboard", labelKey: "dashboardTitle", icon: LayoutDashboard },
] as const

// Facts about the system that the booking form cannot show. Each pair is a
// label naming the rule and a value stating it.
const FACTS = [
  { labelKey: "slot", valueKey: "slotDescription" },
  { labelKey: "days", valueKey: "daysDescription" },
  { labelKey: "duration", valueKey: "durationDescription" },
  { labelKey: "validation", valueKey: "validationDescription" },
] as const

export default function HomePage() {
  const t = useTranslations("home")
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [announcementOpen, setAnnouncementOpen] = useState(false)

  useEffect(() => {
    let active = true
    getCurrentAnnouncement()
      .then((value) => {
        if (active) setAnnouncement(value?.enabled && value.content?.trim() ? value : null)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  return (
    <AppShell>
      {announcement ? (
        <Alert className="grid-cols-1 items-start gap-3 px-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:gap-x-3">
          <Megaphone aria-hidden />
          <div className="flex min-w-0 flex-col gap-1">
            <AlertTitle className="break-words">
              {announcement.title || t("announcementFallbackTitle")}
            </AlertTitle>
            <AlertDescription className="min-w-0 break-words [&>div]:line-clamp-2">
              <MarkdownContent content={announcement.content} />
            </AlertDescription>
          </div>
          <TooltipProvider delayDuration={80}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t("announcementReadMore")}
                  onClick={() => setAnnouncementOpen(true)}
                  className="size-9 justify-self-start sm:justify-self-end"
                >
                  <Maximize2 aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("announcementReadMore")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Alert>
      ) : null}

      <Separator className="my-6" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LAUNCHER.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className="flex min-w-0 flex-col items-start gap-3 rounded-lg border px-4 py-6 transition-colors outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <item.icon aria-hidden className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium break-words">{t(item.labelKey)}</span>
          </Link>
        ))}
      </div>

      <section aria-labelledby="booking-rules-title" className="mt-6 min-w-0">
        <Card>
          <CardHeader>
            <CardTitle id="booking-rules-title">{t("factsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {FACTS.map((fact) => (
                  <TableRow key={fact.labelKey}>
                    <TableHead scope="row" className="w-32 font-normal text-muted-foreground">
                      {t(fact.labelKey)}
                    </TableHead>
                    <TableCell className="font-medium">{t(fact.valueKey)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="break-words">
              {announcement?.title || t("announcementFallbackTitle")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t("announcementDescription")}
            </DialogDescription>
          </DialogHeader>
          <MarkdownContent content={announcement?.content || ""} />
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
