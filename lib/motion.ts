// Shared page-entrance animation variants (motion/react).

export function staggerContainer(staggerChildren = 0.08) {
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren } },
  } as const
}

export const containerVariants = staggerContainer()

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const
