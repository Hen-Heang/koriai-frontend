"use client"

import { motion } from "motion/react"

import { itemVariants } from "@/lib/motion"

export function ErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={itemVariants}
      className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive"
    >
      {children}
    </motion.div>
  )
}
