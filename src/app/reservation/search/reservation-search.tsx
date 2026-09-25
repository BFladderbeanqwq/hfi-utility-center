"use client"

import { useTranslations } from "next-intl"
import { useAppLocale } from "@/app/providers"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { Spinner } from "@/components/ui/spinner"
import { NeoFooter, NeoPage } from "@/components/neo/shared"
import type { Reservation } from "@/lib/api/types"

import { ReservationResults } from "./reservation-results"
import { ReservationSearchFilterForm } from "./reservation-search-filters"
import { ReservationSearchPagination } from "./reservation-search-pagination"
import { reservationSearchHref, type ReservationSearchFilters } from "./search-query"
import { useReservationSearch } from "./use-reservation-search"

export function ReservationSearch({ filters }: { filters: ReservationSearchFilters }) {
  const t = useTranslations("searchPage")
  const { locale } = useAppLocale()
  const zh = locale === "zh-CN"
  const { catalog, result, loading, error, catalogError, retry } = useReservationSearch(filters)

  return (
    <NeoPage>
      <main id="main-content" className="internal-main booking-list-page">
        <div className="list-layout">
          <aside className="booking-sidebar">
            <div className="booking-sidebar__intro">
              <strong>{t("filtersTitle")}</strong>
              <span>{t("filtersDescription")}</span>
            </div>
            {catalogError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {zh
                    ? "场地筛选暂时无法加载，仍可按关键词查询。"
                    : "Room filters are unavailable. Keyword search still works."}
                </AlertDescription>
                <Button variant="outline" onClick={retry}>
                  {zh ? "重新加载" : "Retry"}
                </Button>
              </Alert>
            )}
            <ReservationSearchFilterForm
              key={reservationSearchHref(filters, filters.page)}
              catalog={catalog}
              filters={filters}
            />
          </aside>
          <section className="booking-list-content">
            <div className="page-title-row">
              <div>
                <h1>{t("title")}</h1>
              </div>
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>{zh ? "预约暂时无法加载" : "Bookings could not be loaded"}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button variant="outline" onClick={retry}>
                  {zh ? "重试" : "Retry"}
                </Button>
              </Alert>
            ) : (
              <SearchContent
                loading={loading}
                reservations={result.reservations}
                sort={filters.sort}
              />
            )}
            {!loading && !error ? (
              <div className="list-pagination">
                <div className="list-pagination__summary">
                  <span>{t("total", { count: result.total })}</span>
                  <span>{t("page", { page: filters.page + 1 })}</span>
                </div>
                <ReservationSearchPagination
                  filters={filters}
                  totalReservations={result.total}
                  previousLabel={t("previous")}
                  nextLabel={t("next")}
                />
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <NeoFooter />
    </NeoPage>
  )
}

function SearchContent({
  loading,
  reservations,
  sort,
}: {
  loading: boolean
  reservations: Reservation[]
  sort: ReservationSearchFilters["sort"]
}) {
  const t = useTranslations("searchPage")

  if (loading) {
    return (
      <p className="flex items-center gap-2 py-5 text-sm text-muted-foreground" aria-live="polite">
        <Spinner />
        {t("loading")}
      </p>
    )
  }
  if (reservations.length) {
    return <ReservationResults reservations={reservations} sort={sort} />
  }

  return (
    <section className="py-16">
      <p className="font-medium">{t("emptyTitle")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("emptyDescription")}</p>
    </section>
  )
}
