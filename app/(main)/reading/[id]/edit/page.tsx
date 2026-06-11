"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useSyncExternalStore } from "react"

import { UnitEditor } from "@/components/reading/UnitEditor"
import {
  getAllReadingUnits,
  getReadingUnitsServerSnapshot,
  subscribeReadingUnits,
} from "@/lib/reading"

export default function EditReadingUnitPage() {
  const params = useParams<{ id: string }>()
  const units = useSyncExternalStore(
    subscribeReadingUnits,
    getAllReadingUnits,
    getReadingUnitsServerSnapshot
  )
  const unit = units.find((u) => u.id === params.id)

  if (!unit) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-bold text-foreground">Unit not found.</p>
        <Link href="/reading" className="text-sm font-black text-emerald-600 hover:underline">
          Back to Reading Units
        </Link>
      </div>
    )
  }

  return <UnitEditor key={unit.id} unit={unit} />
}
