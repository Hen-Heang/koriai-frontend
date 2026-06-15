"use client"

import { PageHero } from "@/components/app/page-hero"
import { Calendar } from "@/components/calendar/Calendar"

// Standalone personal-tasks calendar (goal_id = null). Ports Orbit
// routes/calendar.tsx — the same Calendar component is embedded in the goal
// detail Tasks tab. Realtime/PWA/gcal seams are deferred (see INTEGRATION.md).
export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHero
        eyebrow="Planner"
        title="Calendar"
        description="Schedule and review your tasks across day, week, and month views."
      />
      <div className="h-[calc(100dvh-13rem)] min-h-[520px]">
        <Calendar />
      </div>
    </div>
  )
}
