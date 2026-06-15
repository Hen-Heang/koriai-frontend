"use client"

import { useParams } from "next/navigation"

import { PageHero } from "@/components/app/page-hero"

// Goal detail: overview, embedded calendar (tasks), settings. Ports Orbit
// pages/GoalDetail.tsx. Members / analytics / AI chat / themes tabs are
// deferred seams (see INTEGRATION.md).
export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6" data-goal-id={id}>
      <PageHero
        eyebrow="Goal"
        title="Goal detail"
        description="Progress, tasks, and deadline at a glance."
      />
      {/* GoalDetail (overview + tasks calendar + settings) — ported next. */}
    </div>
  )
}
