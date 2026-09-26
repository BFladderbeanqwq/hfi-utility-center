import { ArrowLeft, CalendarPlus, CheckCircle2, ListChecks } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

export function SuccessStep({
  reservationId,
  adminForce = false,
  onReset,
}: {
  reservationId?: number
  adminForce?: boolean
  onReset: () => void
}) {
  const t = useTranslations("booking")
  const adminT = useTranslations("admin")
  return (
    <section className="mx-auto flex w-full max-w-xl min-w-0 flex-col items-center gap-3 py-6 text-center">
      <span
        aria-hidden
        className="t-success-check flex size-14 items-center justify-center rounded-full bg-success-soft text-success-soft-foreground"
      >
        <CheckCircle2 className="size-7" />
      </span>
      <h2 className="text-xl font-semibold break-words">
        {adminForce ? adminT("forceSuccessTitle") : t("success")}
      </h2>
      <p className="max-w-md text-sm break-words text-muted-foreground">
        {adminForce && reservationId
          ? adminT("forceSuccessDescription", { id: reservationId })
          : t("successDescription")}
      </p>
      {adminForce ? (
        <p className="max-w-md text-sm break-words text-muted-foreground">
          {adminT("forceConflictHandled")}
        </p>
      ) : null}
      {reservationId ? (
        <p className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-muted-foreground">{t("reservationNumberLabel")}</span>
          <strong className="font-mono text-lg tabular-nums">#{reservationId}</strong>
        </p>
      ) : null}
      <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-2">
        <Button asChild className="min-h-11 sm:min-h-8">
          <Link href={adminForce ? "/admin/reservation" : "/reservation/search"} prefetch={false}>
            <ListChecks aria-hidden />
            {t("viewReservations")}
          </Link>
        </Button>
        <Button type="button" variant="outline" onClick={onReset} className="min-h-11 sm:min-h-8">
          <CalendarPlus aria-hidden />
          {adminForce ? adminT("forceCreateAnother") : t("bookAgain")}
        </Button>
        {!adminForce ? (
          <Button asChild variant="ghost" className="min-h-11 sm:min-h-8">
            <Link href="/" prefetch={false}>
              <ArrowLeft aria-hidden />
              {t("home")}
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  )
}
