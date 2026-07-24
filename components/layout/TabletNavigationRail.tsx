"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { NavIconRow } from "@/components/layout/NavItem"
import {
  aiCoachItem,
  isNavigationItemActive,
  primarySections,
  settingsItem,
  todayItem,
  type NavSearchParams,
} from "@/lib/navigation"

import { ProfileMenu } from "./ProfileMenu"
import { WorkspaceFlyout } from "./WorkspaceFlyout"

export const RAIL_WIDTH = 80

// AI Coach is a single destination, not a group — it gets a direct icon row
// rather than a flyout, so tapping it always lands on /chat.
const railSections = primarySections.filter((s) => s.id !== "ai")

/**
 * 768–1199px navigation. Compact icon rail; sections with child routes open an
 * accessible flyout instead of forcing a full sidebar into a narrow viewport.
 * The mobile bottom bar is never used at these widths.
 */
export function TabletNavigationRail({
  pathname,
  searchParams,
  activeSectionId,
}: {
  pathname: string
  searchParams: NavSearchParams
  activeSectionId?: string
}) {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null)

  return (
    <aside
      aria-label="Main navigation"
      style={{ width: RAIL_WIDTH }}
      className="sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-sidebar"
    >
      <div className="flex justify-center px-2 py-4">
        <Link
          href={todayItem.href}
          aria-label="Hengo home"
          className="flex size-9 items-center justify-center overflow-hidden rounded-lg outline-none ring-1 ring-border focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image src="/hengo-icon.svg" alt="" width={36} height={36} className="size-full" />
        </Link>
      </div>

      <div className="mx-3 h-px bg-border" />

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        <NavIconRow
          item={todayItem}
          showLabel
          active={isNavigationItemActive({ pathname, searchParams, item: todayItem })}
        />

        {railSections.map((section) => (
          <WorkspaceFlyout
            key={section.id}
            section={section}
            pathname={pathname}
            searchParams={searchParams}
            active={section.id === activeSectionId}
            open={openSectionId === section.id}
            onOpenChange={(open) => setOpenSectionId(open ? section.id : null)}
          />
        ))}

        <div className="pt-2">
          <div className="mb-2 h-px bg-border" />
          <NavIconRow
            item={aiCoachItem}
            showLabel
            active={isNavigationItemActive({ pathname, searchParams, item: aiCoachItem })}
          />
        </div>
      </nav>

      <div className="space-y-1 border-t border-border px-2 py-3">
        <NavIconRow
          item={settingsItem}
          showLabel
          active={isNavigationItemActive({ pathname, searchParams, item: settingsItem })}
        />
        <ProfileMenu collapsed side="right" />
      </div>
    </aside>
  )
}
