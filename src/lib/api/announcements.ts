import { api } from "@/lib/api/client"
import type { Announcement, ApiResponse } from "@/lib/api/types"

export async function getCurrentAnnouncement() {
  const response = await api.get<ApiResponse<Announcement | null>>("/announcement/current", {
    suppressErrorToast: true,
  })
  return response.data.data ?? null
}

// The admin endpoint reports "no announcement yet" the same way the public
// one does — `data: null` — so the payload is nullable here too. The
// non-null assertion this used to carry was a compile-time claim the server
// never made: when `data` was absent it handed `undefined` to a caller that
// reads `announcement.updatedAt` during render, and the resulting TypeError
// unwound the whole document.
export async function getAdminAnnouncement() {
  const response = await api.get<ApiResponse<Announcement | null>>("/announcement/admin")
  return response.data.data ?? null
}

export const updateAnnouncement = (title: string, content: string, enabled: boolean) =>
  api.post("/announcement/update", { title, content, enabled })
