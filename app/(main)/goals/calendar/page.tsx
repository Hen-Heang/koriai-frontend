"use client"

import { PageHero } from "@/components/app/page-hero"

// Standalone personal-tasks calendar (goal_id = null). Ports Orbit
// routes/calendar.tsx + components/calendar/*. The same Calendar component is
// embedded in the goal detail Tasks tab. See INTEGRATION.md.
export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Planner"
        title="Calendar"
        description="Schedule and review your tasks across day, week, and month views."
      />
      {/* Calendar (day/week/month) + task dialogs — ported next. */}
    </div>
  )
}
