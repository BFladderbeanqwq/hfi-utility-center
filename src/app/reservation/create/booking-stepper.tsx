"use client"

import { Check } from "lucide-react"
import { Fragment, type ReactNode } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"

import { bookingSteps, type BookingStepId } from "./form"

/** Clickable progress breadcrumb. Only completed steps are navigable. */
export function BookingStepper({
  titles,
  currentStepIndex,
  isWorking,
  onGoToStep,
}: {
  titles: Record<BookingStepId, ReactNode>
  currentStepIndex: number
  isWorking: boolean
  onGoToStep: (step: BookingStepId) => void
}) {
  return (
    <Breadcrumb className="mb-4 min-w-0">
      <BreadcrumbList className="min-w-0 flex-wrap gap-y-1">
        {bookingSteps.map((step, index) => {
          const complete = index < currentStepIndex
          const current = index === currentStepIndex
          return (
            <Fragment key={step.id}>
              <BreadcrumbItem>
                {complete ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    disabled={isWorking}
                    onClick={() => onGoToStep(step.id)}
                    className="min-h-8 gap-1.5 rounded-md px-1.5 text-xs"
                  >
                    <Check aria-hidden className="size-3.5 text-success" />
                    <span className="hidden sm:inline">{titles[step.id]}</span>
                    <span className="sr-only sm:hidden">
                      {titles[step.id]} {index + 1}
                    </span>
                  </Button>
                ) : current ? (
                  <BreadcrumbPage
                    aria-current="step"
                    className="flex min-h-8 items-center gap-1.5 px-1.5 text-xs font-medium text-foreground"
                  >
                    <span className="tabular-nums">{index + 1}</span>
                    <span className="hidden sm:inline">{titles[step.id]}</span>
                    <span className="sr-only sm:hidden">{titles[step.id]}</span>
                  </BreadcrumbPage>
                ) : (
                  <span
                    aria-hidden
                    className="flex min-h-8 items-center gap-1.5 px-1.5 text-xs text-muted-foreground/70"
                  >
                    <span className="tabular-nums">{index + 1}</span>
                    <span className="hidden sm:inline">{titles[step.id]}</span>
                  </span>
                )}
              </BreadcrumbItem>
              {index < bookingSteps.length - 1 ? <BreadcrumbSeparator /> : null}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
