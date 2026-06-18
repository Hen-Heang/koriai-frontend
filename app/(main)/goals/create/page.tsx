"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence, type Variants } from "motion/react"
import { ArrowRight, Filter, Loader2, Search, Sparkles, Zap } from "lucide-react"
import { toast } from "sonner"

import { PageHero } from "@/components/app/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import EmojiIconPicker from "@/components/ui/emoji-icon-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { goalTemplates } from "@/lib/goal-templates"
import type { GoalTemplate } from "@/lib/goal-templates/types"
import { useCreateGoal } from "@/hooks/useGoalMutations"
import { cn } from "@/lib/utils"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
}

export default function CreateGoalPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [quickTitle, setQuickTitle] = useState("")
  const [quickIcon, setQuickIcon] = useState<string | null>(null)
  const [noDuration, setNoDuration] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { createGoal, isLoading: isQuickCreating } = useCreateGoal()

  const categories = Array.from(new Set(goalTemplates.map((t) => t.category)))
  const filteredTemplates = goalTemplates.filter((template) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      template.name.toLowerCase().includes(q) ||
      template.description.toLowerCase().includes(q) ||
      template.category.toLowerCase().includes(q)
    const matchesCategory = activeCategory ? template.category === activeCategory : true
    return matchesSearch && matchesCategory
  })

  const handleSelectTemplate = (template: GoalTemplate) => {
    router.push(`/goals/create/template/${template.id}`)
  }

  const handleQuickCreate = async () => {
    if (!quickTitle.trim()) {
      toast.error("Title is required", { description: "Please enter a goal title." })
      return
    }
    const defaultTargetDate = new Date()
    defaultTargetDate.setMonth(defaultTargetDate.getMonth() + 1)

    const result = await createGoal({
      title: quickTitle.trim(),
      description: "",
      target_date: noDuration ? null : defaultTargetDate,
      no_duration: noDuration,
      start_date: new Date(),
      metadata: {
        version: 1,
        goal_type: "general",
        start_date: new Date().toISOString(),
        no_duration: noDuration,
        icon: quickIcon ?? undefined,
      },
    })
    if (result.success && result.goal?.id) {
      router.push(`/goals/${result.goal.id}`)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Planner"
        title="New goal"
        description="Start from a template or launch a blank goal — then schedule the work."
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* Left: Quick launch + filters + custom link */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <div className="mb-1 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Zap size={20} />
                </div>
                <CardTitle className="text-xl font-bold">Quick Launch</CardTitle>
              </div>
              <CardDescription>Enter a title to instantly create a new goal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="quick-goal-title"
                  className="ml-1 text-xs font-bold uppercase tracking-wide text-muted-foreground"
                >
                  Goal Title
                </Label>
                <div className="flex items-center gap-2">
                  <EmojiIconPicker value={quickIcon} onChange={setQuickIcon} align="start">
                    <button
                      type="button"
                      aria-label="Pick goal icon"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-xl transition-all hover:border-primary/40 hover:bg-primary/20"
                    >
                      {quickIcon ?? (
                        <span className="text-sm font-bold text-primary">
                          {quickTitle.trim().charAt(0).toUpperCase() || "G"}
                        </span>
                      )}
                    </button>
                  </EmojiIconPicker>
                  <Input
                    id="quick-goal-title"
                    placeholder="e.g., Master Quantum Computing"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        void handleQuickCreate()
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/30 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Infinite Duration</span>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    No specific deadline
                  </span>
                </div>
                <Switch checked={noDuration} onCheckedChange={setNoDuration} />
              </div>

              <Button
                onClick={handleQuickCreate}
                disabled={isQuickCreating || !quickTitle.trim()}
                className="w-full"
                size="lg"
              >
                {isQuickCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create goal"
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <Filter size={14} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Categories
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <Card
            className="cursor-pointer border-dashed transition-colors hover:border-primary/40"
            onClick={() => router.push("/goals/create/custom")}
          >
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mb-1 text-base font-bold">Custom Goal</h3>
              <p className="px-4 text-xs font-medium text-muted-foreground">
                Build a unique goal with full manual control.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: template grid */}
        <div className="lg:col-span-2">
          <div className="relative mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full pl-11"
            />
          </div>

          <AnimatePresence mode="popLayout">
            {filteredTemplates.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                  <Search className="h-8 w-8 text-muted-foreground opacity-30" />
                </div>
                <h3 className="mb-2 text-xl font-bold tracking-tight">No templates found</h3>
                <p className="max-w-xs text-sm font-medium text-muted-foreground">
                  No templates match your search.
                </p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("")
                    setActiveCategory(null)
                  }}
                  className="mt-6 text-primary"
                >
                  Clear filters
                </Button>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-5 md:grid-cols-2"
              >
                {filteredTemplates.map((template) => (
                  <motion.div key={template.id} variants={itemVariants}>
                    <Card
                      className="group relative flex h-full cursor-pointer flex-col rounded-3xl transition-all hover:border-primary/30 hover:shadow-lg"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="p-6 sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className="mb-1 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-lg ring-2 ring-white/20 transition-transform group-hover:scale-110 dark:ring-white/5"
                            style={{ background: template.color }}
                          >
                            {template.icon}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                          >
                            <ArrowRight className="h-5 w-5 text-primary" />
                          </Button>
                        </div>
                        <CardTitle className="mt-4 text-xl font-bold leading-tight tracking-tight transition-colors group-hover:text-primary">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 text-sm font-medium leading-relaxed">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto p-6 pt-0 sm:p-7 sm:pt-0">
                        <div className="mb-4">
                          <span className="rounded-lg border border-primary/10 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                            {template.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 border-t border-foreground/[0.05] pt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground/60">
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={12} className="text-primary/60" />
                            {template.sections.length} sections
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Zap size={12} className="text-primary/60" />
                            {template.sections.reduce((acc, s) => acc + s.fields.length, 0)} fields
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
