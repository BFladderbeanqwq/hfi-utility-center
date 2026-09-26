"use client"

import { ArrowLeft, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/** Sticky footer: the flow error, then back / next-or-submit. */
export function BookingActionBar({
  flowError,
  isFirstStep,
  isLastStep,
  isWorking,
  isForce,
  onPrevious,
  onNext,
}: {
  flowError?: string
  isFirstStep: boolean
  isLastStep: boolean
  isWorking: boolean
  isForce: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  const t = useTranslations("booking")
  const adminT = useTranslations("admin")
  const common = useTranslations("common")

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-4 flex min-w-0 flex-wrap items-center gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:justify-end sm:px-6 lg:-mx-8 lg:px-8">
      {flowError ? (
        <p className="order-last w-full min-w-0 text-sm break-words text-destructive">
          {flowError}
        </p>
      ) : null}
      <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
        <Button
          type="button"
          variant="outline"
          disabled={isFirstStep || isWorking}
          onClick={onPrevious}
          className="min-h-11 flex-1 sm:min-h-8 sm:flex-none"
        >
          <ArrowLeft aria-hidden />
          {common("back")}
        </Button>
        {isLastStep ? (
          <Button
            type="submit"
            disabled={isWorking}
            className="min-h-11 flex-1 sm:min-h-8 sm:flex-none"
          >
            {isWorking ? <Spinner /> : null}
            {isForce ? adminT("forceConfirm") : t("confirmReservation")}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isWorking}
            onClick={onNext}
            className="min-h-11 flex-1 sm:min-h-8 sm:flex-none"
          >
            {isWorking ? <Spinner /> : null}
            {common("next")}
            {isWorking ? null : <ArrowRight aria-hidden />}
          </Button>
        )}
      </div>
    </div>
  )
}
