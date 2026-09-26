import { CancelReservationFlow } from "./cancel-reservation-flow"

type SearchParams = Record<string, string | string[] | undefined>

export default async function CancelReservationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { token } = await searchParams
  return <CancelReservationFlow token={typeof token === "string" ? token : ""} />
}
