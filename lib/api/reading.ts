import type { ReadingUnit, ReadingProgressEntry } from "@/lib/reading"
import { api } from "./client"

// Reading Units (user-created units, CRUD)
export type ReadingUnitPayload = Omit<ReadingUnit, "id">

// One unit's saved progress for the current user, keyed by unitId.
export interface ReadingProgressRecord extends ReadingProgressEntry {
  unitId: string
}

export const readingApi = {
  getUnits: () =>
    api.get("/reading/units").then((r) => r.data.data) as Promise<ReadingUnit[]>,
  getUnit: (id: string) =>
    api.get(`/reading/units/${id}`).then((r) => r.data.data) as Promise<ReadingUnit>,
  createUnit: (data: ReadingUnitPayload) =>
    api.post("/reading/units", data).then((r) => r.data.data) as Promise<ReadingUnit>,
  updateUnit: (id: string, data: ReadingUnitPayload) =>
    api.put(`/reading/units/${id}`, data).then((r) => r.data.data) as Promise<ReadingUnit>,
  deleteUnit: (id: string) =>
    api.delete(`/reading/units/${id}`).then((r) => r.data.data) as Promise<{
      deleted: boolean
    }>,

  // Per-unit progress (read/quiz state), server-backed so it syncs across devices.
  getProgress: () =>
    api.get("/reading/progress").then((r) => r.data.data) as Promise<ReadingProgressRecord[]>,
  startUnit: (unitId: string) =>
    api.post(`/reading/progress/${unitId}/start`).then((r) => r.data.data) as Promise<ReadingProgressRecord>,
  completeUnit: (unitId: string) =>
    api.post(`/reading/progress/${unitId}/complete`).then((r) => r.data.data) as Promise<ReadingProgressRecord>,
  submitQuizResult: (unitId: string, score: number, total: number) =>
    api
      .post(`/reading/progress/${unitId}/quiz`, { score, total })
      .then((r) => r.data.data) as Promise<ReadingProgressRecord>,
}
