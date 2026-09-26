"use client"

import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/**
 * The reload action every data page shows in its header. The icon alone is not a
 * label, so the button always carries an `aria-label` and the tooltip only ever
 * repeats it.
 */
export function RefreshButton({
  label,
  loading,
  onRefresh,
  className,
}: {
  label: string
  loading: boolean
  onRefresh: () => void
  className?: string
}) {
  return (
    <TooltipProvider delayDuration={80}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn("size-9", className)}
            aria-label={label}
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
