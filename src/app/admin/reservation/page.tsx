"use client"

import { useMemo, useState } from "react"
import { Check, Download, Inbox, RefreshCw, Search, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { EmptyState, ErrorState, LoadingState } from "@/components/layout/data-state"
import { PageHeader } from "@/components/layout/page-header"
import { StatusBadge } from "@/components/layout/status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAdminMutation, useAdminResource } from "@/lib/api/admin-hooks"
import { getFutureReservations, updateReservationApproval } from "@/lib/api/reservations"
import type { Reservation, ReservationStatus } from "@/lib/api/types"
import { backendHref } from "@/lib/api/client"
import { formatApiTimestamp } from "@/lib/date-time"

const STATUS_FILTERS = ["all", "pending", "approved", "rejected", "cancelled"] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]

const STATUS_DOT: Record<ReservationStatus, string> = {
  pending: "bg-warning",
  approved: "bg-success",
  rejected: "bg-danger",
  cancelled: "bg-muted-foreground",
}

const STATUS_TEXT: Record<ReservationStatus, string> = {
  pending: "text-warning",
  approved: "text-success",
  rejected: "text-danger",
  cancelled: "text-muted-foreground",
}

const MOBILE_GRID = "grid min-w-0 grid-cols-2 gap-x-4 gap-y-2.5"

interface ReservationFieldData {
  label: string
  value: string
  href?: string
}

export default function AdminReservationsPage() {
  const t = useTranslations("admin")
  const common = useTranslations("common")
  const statusT = useTranslations("status")
  const locale = useLocale()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [rejectingId, setRejectingId] = useState<number>()
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string>()
  const reservationResource = useAdminResource<Reservation[]>({
    loadResource: getFutureReservations,
    initialData: [],
  })
  const { mutate, working } = useAdminMutation({
    reload: reservationResource.reload,
  })
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }),
    [locale],
  )

  function formatDateTime(value: string) {
    return formatApiTimestamp(dateTimeFormatter, value)
  }

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return reservationResource.data.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (!keyword) return true
      return [
        item.studentName,
        item.email,
        item.studentId,
        item.roomName,
        item.className,
        item.reason,
        String(item.id),
      ].some((value) => value?.toLowerCase().includes(keyword))
    })
  }, [query, reservationResource.data, statusFilter])

  async function submitDecision(id: number, nextStatus: "approved" | "rejected") {
    const approved = nextStatus === "approved"
    const rejectionReason = reason.trim()
    if (!approved && !rejectionReason) {
      setError(t("rejectionRequired"))
      return
    }

    setError(undefined)
    const saved = await mutate(
      () => updateReservationApproval(id, approved, approved ? undefined : rejectionReason),
      t(approved ? "reservationApproved" : "reservationRejected"),
    )
    if (saved) {
      setRejectingId(undefined)
      setReason("")
    }
  }

  function startRejection(id: number) {
    setRejectingId(id)
    setReason("")
    setError(undefined)
  }

  function cancelRejection() {
    setRejectingId(undefined)
    setReason("")
    setError(undefined)
  }

  const refresh = () => void reservationResource.reload().catch(() => undefined)

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={t("reservationsTitle")}
        description={t("reservationsDescription")}
        actions={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  aria-label={common("refresh")}
                  onClick={refresh}
                  disabled={reservationResource.loading}
                >
                  <RefreshCw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{common("refresh")}</TooltipContent>
            </Tooltip>
            <Button asChild variant="outline">
              <a href={backendHref("/reservation/export")}>
                <Download />
                {t("exportReservations")}
              </a>
            </Button>
          </>
        }
      />

      <div className="flex min-w-0 flex-col gap-3">
        <InputGroup className="w-full">
          <InputGroupInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("reservationSearch")}
            aria-label={t("reservationSearch")}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <ToggleGroup
          type="single"
          variant="outline"
          value={statusFilter}
          onValueChange={(value) => {
            if (value) setStatusFilter(value as StatusFilter)
          }}
          aria-label={t("reservationStatusFilter")}
          className="w-full flex-wrap justify-start"
        >
          {STATUS_FILTERS.map((status) => (
            <ToggleGroupItem key={status} value={status} className="h-11 sm:h-8">
              {status === "all" ? t("allStatuses") : statusT(status)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <Separator />

      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{t("reservationQueue")}</h2>
          <span className="text-sm text-muted-foreground tabular-nums">{filtered.length}</span>
        </div>

        {reservationResource.error && !reservationResource.loading ? (
          <ErrorState onRetry={refresh} retryLabel={common("retry")} />
        ) : null}

        {reservationResource.loading ? <LoadingState label={t("reservationsLoading")} /> : null}

        {!reservationResource.loading && !filtered.length ? (
          <EmptyState
            icon={Inbox}
            title={t("reservationsEmpty")}
            description={t("reservationsEmptyDescription")}
          />
        ) : null}

        {!reservationResource.loading && filtered.length ? (
          <>
            <div className="hidden min-w-0 sm:block">
              <Table className="min-w-[62rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">{t("columnReservation")}</TableHead>
                    <TableHead>{t("columnStudent")}</TableHead>
                    <TableHead>{t("room")}</TableHead>
                    <TableHead>{t("time")}</TableHead>
                    <TableHead>{t("reason")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="w-32 text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-semibold text-primary tabular-nums">
                        #{item.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">{item.studentName}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {[item.studentId, item.className, item.campusName]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </span>
                          <a
                            href={`mailto:${item.email}`}
                            className="truncate text-xs text-muted-foreground underline underline-offset-4"
                          >
                            {item.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-40 truncate">{item.roomName || "—"}</TableCell>
                      <TableCell className="tabular-nums">
                        <div className="flex flex-col">
                          <span>{formatDateTime(item.startTime)}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(item.endTime)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <span className="line-clamp-2 break-words">{item.reason}</span>
                      </TableCell>
                      <TableCell>
                        {item.status === "pending" ? (
                          <StatusBadge tone="pending">{statusT(item.status)}</StatusBadge>
                        ) : (
                          <StatusDot status={item.status} label={statusT(item.status)} />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {item.status !== "approved" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-success hover:bg-success-soft sm:h-7"
                              disabled={working}
                              onClick={() => void submitDecision(item.id, "approved")}
                            >
                              <Check />
                              {t("approve")}
                            </Button>
                          ) : null}
                          {item.status !== "rejected" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-danger hover:bg-danger-soft sm:h-7"
                              disabled={working}
                              onClick={() => startRejection(item.id)}
                            >
                              <X />
                              {t("reject")}
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="flex min-w-0 flex-col divide-y divide-border sm:hidden">
              {filtered.map((item) => (
                <li key={item.id} className="py-4">
                  <ReservationCard
                    reservation={item}
                    statusLabel={statusT(item.status)}
                    formatDateTime={formatDateTime}
                    working={working}
                    approveLabel={t("approve")}
                    rejectLabel={t("reject")}
                    studentInformationLabel={t("studentInformation")}
                    reservationDetailsLabel={t("reservationDetails")}
                    onApprove={() => void submitDecision(item.id, "approved")}
                    onReject={() => startRejection(item.id)}
                    fields={[
                      { label: t("name"), value: item.studentName },
                      { label: t("studentId"), value: item.studentId || "—" },
                      { label: t("email"), value: item.email, href: `mailto:${item.email}` },
                      { label: t("class"), value: item.className || "—" },
                      { label: t("campus"), value: item.campusName || "—" },
                    ]}
                    details={[
                      { label: t("room"), value: item.roomName || "—" },
                      { label: t("startTime"), value: formatDateTime(item.startTime) },
                      { label: t("endTime"), value: formatDateTime(item.endTime) },
                      { label: t("reason"), value: item.reason },
                    ]}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <AlertDialog
        open={rejectingId !== undefined}
        onOpenChange={(open) => {
          if (!open) cancelRejection()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <X />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("reject")}</AlertDialogTitle>
            <AlertDialogDescription>{t("rejectionDialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="rejection-reason">{t("reason")}</FieldLabel>
            <Textarea
              id="rejection-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("rejectionPlaceholder")}
              aria-invalid={Boolean(error)}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>{common("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={working}
              onClick={(event) => {
                event.preventDefault()
                if (rejectingId !== undefined) {
                  void submitDecision(rejectingId, "rejected")
                }
              }}
            >
              {t("confirmReject")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatusDot({ status, label }: { status: ReservationStatus; label: string }) {
  return (
    <span className="flex items-center gap-2 text-sm whitespace-nowrap">
      <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
      <span className={STATUS_TEXT[status]}>{label}</span>
    </span>
  )
}

function ReservationCard({
  reservation,
  statusLabel,
  formatDateTime,
  working,
  approveLabel,
  rejectLabel,
  studentInformationLabel,
  reservationDetailsLabel,
  fields,
  details,
  onApprove,
  onReject,
}: {
  reservation: Reservation
  statusLabel: string
  formatDateTime: (value: string) => string
  working: boolean
  approveLabel: string
  rejectLabel: string
  studentInformationLabel: string
  reservationDetailsLabel: string
  fields: ReservationFieldData[]
  details: ReservationFieldData[]
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium break-words">
            {formatDateTime(reservation.startTime)}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {reservation.roomName || "—"} · #{reservation.id}
          </span>
        </div>
        {reservation.status === "pending" ? (
          <StatusBadge tone="pending">{statusLabel}</StatusBadge>
        ) : (
          <StatusDot status={reservation.status} label={statusLabel} />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          {studentInformationLabel}
        </h3>
        <dl className={MOBILE_GRID}>
          {fields.map((field) => (
            <ReservationField key={field.label} {...field} />
          ))}
        </dl>
      </div>
      <div className="min-w-0">
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          {reservationDetailsLabel}
        </h3>
        <dl className={MOBILE_GRID}>
          {details.map((field) => (
            <ReservationField key={field.label} {...field} />
          ))}
        </dl>
      </div>
      <div className="flex flex-wrap gap-2">
        {reservation.status !== "approved" ? (
          <Button
            variant="outline"
            className="h-11 flex-1 border-success-border text-success hover:bg-success-soft sm:h-8"
            disabled={working}
            onClick={onApprove}
          >
            <Check />
            {approveLabel}
          </Button>
        ) : null}
        {reservation.status !== "rejected" ? (
          <Button
            variant="ghost"
            className="h-11 flex-1 text-danger hover:bg-danger-soft sm:h-8"
            disabled={working}
            onClick={onReject}
          >
            <X />
            {rejectLabel}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function ReservationField({ label, value, href }: ReservationFieldData) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium break-words">
        {href ? (
          <a href={href} className="underline underline-offset-4">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
