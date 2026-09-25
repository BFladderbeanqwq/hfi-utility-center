"use client"

import { Fragment, useEffect, useState, type FormEvent } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { FormProvider, useForm, useWatch } from "react-hook-form"

import { AppShell } from "@/components/layout/app-shell"
import { ErrorState, LoadingState } from "@/components/layout/data-state"
import { PageHeader } from "@/components/layout/page-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getAdminSession, type AdminSession } from "@/lib/api/auth"
import { getCatalog } from "@/lib/api/catalog"
import { createReservation, forceReservation, getAvailability } from "@/lib/api/reservations"
import type { CatalogData } from "@/lib/api/types"
import { rangeIsAvailable } from "@/lib/reservations/availability"

import {
  bookingSteps,
  reservationDefaults,
  useReservationSchema,
  type BookingStepId,
  type ReservationFormValues,
} from "./form"
import { ClassStep } from "./steps/class-step"
import { DateTimeStep } from "./steps/date-time-step"
import { LocationStep } from "./steps/location-step"
import { ProfileStep } from "./steps/profile-step"
import { ReviewStep } from "./steps/review-step"
import { SuccessStep } from "./steps/success-step"

type ReservationResult = {
  reservationId?: number
}

export function ReservationForm({ mode = "public" }: { mode?: "public" | "adminForce" }) {
  const t = useTranslations("booking")
  const adminT = useTranslations("admin")
  const common = useTranslations("common")
  const isForce = mode === "adminForce"
  const schema = useReservationSchema()
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: reservationDefaults,
    mode: "onTouched",
  })
  const [currentStepId, setCurrentStepId] = useState<BookingStepId>("class")
  const [flowError, setFlowError] = useState<string>()
  const [isWorking, setIsWorking] = useState(false)
  const [result, setResult] = useState<ReservationResult>()
  const [catalog, setCatalog] = useState<CatalogData>()
  const [adminSession, setAdminSession] = useState<AdminSession>()
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string>()
  const [catalogReloadKey, setCatalogReloadKey] = useState(0)
  const [stepDirection, setStepDirection] = useState<"forward" | "back">("forward")
  const [hasSlid, setHasSlid] = useState(false)
  const currentStepIndex = bookingSteps.findIndex((step) => step.id === currentStepId)
  const currentStep = bookingSteps[currentStepIndex]

  // The step body is keyed on the step id, so navigating remounts it and the
  // slide plays on that mount. `hasSlid` is the first-paint guard: the step a
  // user lands on has no previous screen to slide from.
  function goToStep(nextStepId: BookingStepId) {
    const nextIndex = bookingSteps.findIndex((step) => step.id === nextStepId)
    setStepDirection(nextIndex >= currentStepIndex ? "forward" : "back")
    setHasSlid(true)
    setCurrentStepId(nextStepId)
  }

  const stepTitles = {
    class: t("classTitle"),
    location: t("locationTitle"),
    dateTime: t("dateTimeTitle"),
    profile: t("profileTitle"),
    review: t("reviewTitle"),
  }
  const selectedClassId = useWatch({ control: form.control, name: "classId" })
  const selectedClass = catalog?.classes.find((item) => item.id === selectedClassId)
  const isPrivilegedSelection = Boolean(
    catalog?.campuses.find((item) => item.id === selectedClass?.campus)?.isPrivileged,
  )

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      setCatalogLoading(true)
      setCatalogError(undefined)
      try {
        const [data, session] = await Promise.all([
          getCatalog(),
          isForce ? getAdminSession() : Promise.resolve(undefined),
        ])
        if (!active) return

        const priorityClass = findPriorityClass(data)
        if (isForce && (!session || !priorityClass)) {
          throw new Error(adminT("forceLoadError"))
        }
        setCatalog(data)
        setAdminSession(session)
        if (isForce && session && priorityClass) {
          form.reset(forceReservationDefaults(priorityClass.id, session))
        }
      } catch (error) {
        if (active) {
          setCatalogError(error instanceof Error ? error.message : t("connectionError"))
        }
      } finally {
        if (active) setCatalogLoading(false)
      }
    }

    loadCatalog()
    return () => {
      active = false
    }
  }, [adminT, catalogReloadKey, form, isForce, t])

  async function selectedTimeIsStillAvailable(values: ReservationFormValues) {
    if (!catalog) return false

    if (isForce || values.isPrivileged) return true

    const room = catalog.rooms.find((candidate) => candidate.id === values.room)
    if (!room) {
      setFlowError(t("availabilityError"))
      return false
    }

    const availability = await getAvailability(values.room, values.date, room)
    if (rangeIsAvailable(availability.slots, values.startTime, values.endTime)) {
      return true
    }

    form.setValue("startTime", 0)
    form.setValue("endTime", 0)
    setFlowError(t("timeConflict"))
    return false
  }

  async function continueToNextStep() {
    const valid = await form.trigger([...currentStep.fields], {
      shouldFocus: true,
    })
    if (!valid) {
      return
    }

    if (currentStep.id === "dateTime") {
      setIsWorking(true)
      try {
        if (!(await selectedTimeIsStillAvailable(form.getValues()))) return
      } catch (error) {
        setFlowError(error instanceof Error ? error.message : common("unknown"))
        return
      } finally {
        setIsWorking(false)
      }
    }

    const nextStep = bookingSteps[currentStepIndex + 1]
    if (!nextStep) return
    setFlowError(undefined)
    goToStep(nextStep.id)
  }

  async function confirmReservation(values: ReservationFormValues) {
    setIsWorking(true)
    setFlowError(undefined)

    try {
      if (!(await selectedTimeIsStillAvailable(values))) {
        goToStep("dateTime")
        return
      }

      const response = isForce
        ? await forceReservation({
            classId: values.classId,
            room: values.room,
            studentName: values.studentName.trim(),
            studentId: "-",
            email: values.email.trim(),
            reason: values.reason.trim(),
            startTime: values.startTime,
            endTime: values.endTime,
            purposeType: values.purposeType,
            needsMultimedia: values.needsMultimedia,
          })
        : await createReservation({
            classId: values.classId,
            room: values.room,
            studentName: values.studentName.trim(),
            studentId: values.studentId.trim().toUpperCase(),
            email: values.email.trim(),
            reason: values.reason.trim(),
            startTime: values.startTime,
            endTime: values.endTime,
            purposeType: values.purposeType,
            needsMultimedia: values.needsMultimedia,
          })
      setResult(response)
    } catch (error) {
      setFlowError(error instanceof Error ? error.message : common("unknown"))
    } finally {
      setIsWorking(false)
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (currentStep.id !== "review") {
      void continueToNextStep()
      return
    }

    void form.handleSubmit(confirmReservation)(event)
  }

  function returnToPreviousStep() {
    const previousStep = bookingSteps[currentStepIndex - 1]
    if (!previousStep) return
    setFlowError(undefined)
    goToStep(previousStep.id)
  }

  function resetReservation() {
    const priorityClass = catalog && findPriorityClass(catalog)
    form.reset(
      isForce && adminSession && priorityClass
        ? forceReservationDefaults(priorityClass.id, adminSession)
        : reservationDefaults,
    )
    goToStep("class")
    setResult(undefined)
    setFlowError(undefined)
  }

  if (catalogLoading) {
    if (isForce) {
      return (
        <div className="flex min-h-40 items-center justify-center">
          <LoadingState label={adminT("forceLoading")} />
        </div>
      )
    }
    return (
      <AppShell>
        <PageHeader title={t("loadingTitle")} />
        <LoadingState rows={5} />
      </AppShell>
    )
  }

  if (catalogError || !catalog) {
    if (isForce) {
      return (
        <div className="flex min-w-0 flex-col gap-3">
          <ErrorState
            title={adminT("forceLoadError")}
            description={catalogError}
            onRetry={() => setCatalogReloadKey((key) => key + 1)}
          />
        </div>
      )
    }
    return (
      <AppShell>
        <PageHeader title={t("loadError")} />
        <ErrorState
          description={catalogError ?? t("connectionError")}
          onRetry={() => setCatalogReloadKey((key) => key + 1)}
        />
      </AppShell>
    )
  }

  if (result) {
    if (isForce) {
      return <SuccessStep {...result} adminForce onReset={resetReservation} />
    }
    return (
      <AppShell>
        <PageHeader title={t("success")} description={t("successDescription")} />
        <SuccessStep {...result} onReset={resetReservation} />
      </AppShell>
    )
  }

  const stepContent = {
    class: <ClassStep catalog={catalog} privilegedOnly={isForce} />,
    location: <LocationStep catalog={catalog} />,
    dateTime: <DateTimeStep rooms={catalog.rooms} privileged={isPrivilegedSelection} />,
    profile: <ProfileStep adminMode={isForce} />,
    review: <ReviewStep catalog={catalog} />,
  }

  const stepper = (
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
                    onClick={() => goToStep(step.id)}
                    className="min-h-8 gap-1.5 rounded-md px-1.5 text-xs"
                  >
                    <Check aria-hidden className="size-3.5 text-success" />
                    <span className="hidden sm:inline">{stepTitles[step.id]}</span>
                    <span className="sr-only sm:hidden">
                      {stepTitles[step.id]} {index + 1}
                    </span>
                  </Button>
                ) : current ? (
                  <BreadcrumbPage
                    aria-current="step"
                    className="flex min-h-8 items-center gap-1.5 px-1.5 text-xs font-medium text-foreground"
                  >
                    <span className="tabular-nums">{index + 1}</span>
                    <span className="hidden sm:inline">{stepTitles[step.id]}</span>
                    <span className="sr-only sm:hidden">{stepTitles[step.id]}</span>
                  </BreadcrumbPage>
                ) : (
                  <span
                    aria-hidden
                    className="flex min-h-8 items-center gap-1.5 px-1.5 text-xs text-muted-foreground/70"
                  >
                    <span className="tabular-nums">{index + 1}</span>
                    <span className="hidden sm:inline">{stepTitles[step.id]}</span>
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

  const actionBar = (
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
          disabled={currentStepIndex === 0 || isWorking}
          onClick={returnToPreviousStep}
          className="min-h-11 flex-1 sm:min-h-8 sm:flex-none"
        >
          <ArrowLeft aria-hidden />
          {common("back")}
        </Button>
        {currentStep.id === "review" ? (
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
            onClick={() => void continueToNextStep()}
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

  if (isForce) {
    return (
      <FormProvider {...form}>
        <form noValidate onSubmit={handleFormSubmit} className="flex min-w-0 flex-col gap-4">
          {stepper}
          <div
            key={currentStep.id}
            data-direction={stepDirection}
            data-animate={hasSlid ? "" : undefined}
            className="t-page-slide min-w-0"
          >
            {stepContent[currentStep.id]}
          </div>
          {actionBar}
        </form>
      </FormProvider>
    )
  }

  return (
    <AppShell>
      <PageHeader
        title={t("createTitle")}
        description={t("step", {
          current: currentStepIndex + 1,
          total: bookingSteps.length,
        })}
      />
      <FormProvider {...form}>
        <form noValidate onSubmit={handleFormSubmit} className="min-w-0">
          {stepper}
          <div
            key={currentStep.id}
            data-direction={stepDirection}
            data-animate={hasSlid ? "" : undefined}
            className="t-page-slide min-w-0"
          >
            {stepContent[currentStep.id]}
          </div>
          {actionBar}
        </form>
      </FormProvider>
    </AppShell>
  )
}

function findPriorityClass(catalog: CatalogData) {
  const privilegedCampusIds = new Set(
    catalog.campuses.filter((campus) => campus.isPrivileged).map((campus) => campus.id),
  )
  return catalog.classes.find((item) => privilegedCampusIds.has(item.campus))
}

function forceReservationDefaults(classId: number, admin: AdminSession): ReservationFormValues {
  return {
    ...reservationDefaults,
    classId,
    studentName: admin.name,
    email: admin.email,
    isPrivileged: true,
    purposeType: "class",
    isAgreed: true,
  }
}
