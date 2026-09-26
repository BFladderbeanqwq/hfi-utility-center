"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useState, type FormEvent, type ReactNode } from "react"
import { FormProvider, useForm, useWatch } from "react-hook-form"

import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { useErrorShake } from "@/hooks/use-error-shake"
import { createReservation, forceReservation, getAvailability } from "@/lib/api/reservations"
import { rangeIsAvailable } from "@/lib/reservations/availability"

import { BookingActionBar } from "./booking-action-bar"
import { BookingGate } from "./booking-gate"
import { BookingStepper } from "./booking-stepper"
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
import {
  findPriorityClass,
  forceReservationDefaults,
  useBookingCatalog,
} from "./use-booking-catalog"

type ReservationResult = {
  reservationId?: number
}

export function ReservationForm({ mode = "public" }: { mode?: "public" | "adminForce" }) {
  const t = useTranslations("booking")
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
  const [stepDirection, setStepDirection] = useState<"forward" | "back">("forward")
  const [hasSlid, setHasSlid] = useState(false)
  const currentStepIndex = bookingSteps.findIndex((step) => step.id === currentStepId)
  const currentStep = bookingSteps[currentStepIndex]
  const { catalog, catalogLoading, catalogError, reloadCatalog, adminSessionRef } =
    useBookingCatalog(isForce, form)

  function goToStep(nextStepId: BookingStepId) {
    const nextIndex = bookingSteps.findIndex((step) => step.id === nextStepId)
    setStepDirection(nextIndex >= currentStepIndex ? "forward" : "back")
    setHasSlid(true)
    setCurrentStepId(nextStepId)
  }

  const selectedClassId = useWatch({ control: form.control, name: "classId" })
  const selectedClass = catalog?.classes.find((item) => item.id === selectedClassId)
  const isPrivilegedSelection = Boolean(
    catalog?.campuses.find((item) => item.id === selectedClass?.campus)?.isPrivileged,
  )
  const { ref: stepRef, shake: shakeStep } = useErrorShake<HTMLDivElement>()

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
      shakeStep()
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
      isForce && adminSessionRef.current && priorityClass
        ? forceReservationDefaults(priorityClass.id, adminSessionRef.current)
        : reservationDefaults,
    )
    goToStep("class")
    setResult(undefined)
    setFlowError(undefined)
  }

  if (catalogLoading || catalogError || !catalog) {
    return (
      <BookingGate
        isForce={isForce}
        loading={catalogLoading}
        error={catalogError}
        onRetry={reloadCatalog}
      />
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

  const stepContent: Record<BookingStepId, ReactNode> = {
    class: <ClassStep catalog={catalog} privilegedOnly={isForce} />,
    location: <LocationStep catalog={catalog} />,
    dateTime: <DateTimeStep rooms={catalog.rooms} privileged={isPrivilegedSelection} />,
    profile: <ProfileStep adminMode={isForce} />,
    review: <ReviewStep catalog={catalog} />,
  }

  const formBody = (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={handleFormSubmit}
        className={isForce ? "flex min-w-0 flex-col gap-4" : "min-w-0"}
      >
        <BookingStepper
          titles={{
            class: t("classTitle"),
            location: t("locationTitle"),
            dateTime: t("dateTimeTitle"),
            profile: t("profileTitle"),
            review: t("reviewTitle"),
          }}
          currentStepIndex={currentStepIndex}
          isWorking={isWorking}
          onGoToStep={goToStep}
        />
        <div
          key={currentStep.id}
          ref={stepRef}
          data-direction={stepDirection}
          data-animate={hasSlid ? "" : undefined}
          className="t-page-slide min-w-0"
        >
          {stepContent[currentStep.id]}
        </div>
        <BookingActionBar
          flowError={flowError}
          isFirstStep={currentStepIndex === 0}
          isLastStep={currentStep.id === "review"}
          isWorking={isWorking}
          isForce={isForce}
          onPrevious={returnToPreviousStep}
          onNext={() => void continueToNextStep()}
        />
      </form>
    </FormProvider>
  )

  if (isForce) return formBody

  return (
    <AppShell>
      <PageHeader
        title={t("createTitle")}
        description={t("step", {
          current: currentStepIndex + 1,
          total: bookingSteps.length,
        })}
      />
      {formBody}
    </AppShell>
  )
}
