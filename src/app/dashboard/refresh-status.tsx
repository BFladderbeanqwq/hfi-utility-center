"use client"

import { useTranslations } from "next-intl"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * The live-polling readout in the header: how long ago the last poll landed,
 * wrapped in a tooltip naming the cadence. It stays out of the header
 * entirely until a poll has succeeded at least once.
 */
export function RefreshStatus({
  updated,
  error,
  relative,
}: {
  updated: Date | null
  error: boolean
  relative: string
}) {
  const t = useTranslations("dashboard")
  if (!updated || error) return null

  return (
    <span className="min-w-0 text-xs text-muted-foreground">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="truncate rounded-sm tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t("lastUpdated", { time: relative })}
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("refreshEvery")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  )
}
