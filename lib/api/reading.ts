import type { ReadingUnit } from "@/lib/reading"
import { api } from "./client"

// Reading Units (user-created units, CRUD)
export type ReadingUnitPayload = Omit<ReadingUnit, "id">

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
}
