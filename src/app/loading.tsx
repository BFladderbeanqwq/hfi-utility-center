import { AppFrame } from "@/components/layout/app-shell"
import { LoadingState } from "@/components/layout/data-state"

export default function Loading() {
  return (
    <AppFrame>
      <LoadingState rows={4} />
    </AppFrame>
  )
}
