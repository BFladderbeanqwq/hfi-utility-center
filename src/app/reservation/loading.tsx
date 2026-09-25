import { AppFrame } from "@/components/layout/app-shell"
import { LoadingState } from "@/components/layout/data-state"

export default function ReservationLoading() {
  return (
    <AppFrame>
      <LoadingState rows={5} />
    </AppFrame>
  )
}
