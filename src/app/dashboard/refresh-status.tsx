"use client"

import { useTranslations } from "next-intl"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { DOT } from "./facility-board-tokens"

/**
 * The live-polling readout in the header: a pulsing dot that reports whether
 * the background poll is in flight, wrapped in a tooltip naming the cadence,
 * followed by how long ago the last poll landed. It stays out of the header
 * entirely until a poll has succeeded at least once.
 */
export function RefreshStatus({
  updated,
  error,
  loading,
  relative,
}: {
  updated: Date | null
  error: boolean
  loading: boolean
  relative: string
}) {
  const t = useTranslations("dashboard")
  if (!updated || error) return null

  return (
    <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={t("refreshEvery")}
              className="size-2 shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                aria-hidden
                className={cn(
                  "block size-2 rounded-full",
                  loading
                    ? "animate-pulse bg-muted-foreground/40 motion-reduce:animate-none"
                    : DOT.live,
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>{t("refreshEvery")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="truncate tabular-nums">{t("lastUpdated", { time: relative })}</span>
    </span>
  )
}
