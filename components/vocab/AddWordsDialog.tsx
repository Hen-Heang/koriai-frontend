"use client"

import { ClipboardPaste, PencilLine, Sparkles } from "lucide-react"

import { useIsMobile } from "@/hooks/useMobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddWordCard } from "@/components/vocab/AddWordCard"
import { DeckBuilder } from "@/components/vocab/DeckBuilder"
import { TextbookImport } from "@/components/vocab/TextbookImport"

type AddWordsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Existing topics, offered as suggestions in the manual form. */
  topics: string[]
  dueCount: number
  totalCount: number
  /** Terms already saved, used by the import tab to skip duplicates. */
  existingTerms: string[]
  onAdd: (data: {
    category?: string
    term: string
    meaning: string
    example?: string
  }) => Promise<unknown>
  onGenerate: (category: string) => Promise<void>
  onImport: (deckName: string, text: string) => Promise<number>
}

const TITLE = "Add words"
const DESCRIPTION = "Type a word yourself, build a themed deck with AI, or paste a textbook list."

/**
 * Single entry point for getting words into the deck. Renders as a bottom
 * sheet on mobile (soft-keyboard friendly) and a centered dialog on desktop.
 */
export function AddWordsDialog({
  open,
  onOpenChange,
  topics,
  dueCount,
  totalCount,
  existingTerms,
  onAdd,
  onGenerate,
  onImport,
}: AddWordsDialogProps) {
  const isMobile = useIsMobile()

  const tabs = (
    <Tabs defaultValue="manual">
      <TabsList className="h-10 w-full">
        <TabsTrigger value="manual" className="gap-1.5 text-xs font-bold">
          <PencilLine size={14} strokeWidth={2.5} />
          Manual
        </TabsTrigger>
        <TabsTrigger value="ai" className="gap-1.5 text-xs font-bold">
          <Sparkles size={14} strokeWidth={2.5} />
          AI Builder
        </TabsTrigger>
        <TabsTrigger value="import" className="gap-1.5 text-xs font-bold">
          <ClipboardPaste size={14} strokeWidth={2.5} />
          Import
        </TabsTrigger>
      </TabsList>
      <TabsContent value="manual" className="pt-2">
        <AddWordCard embedded categories={topics} onAdd={onAdd} />
      </TabsContent>
      <TabsContent value="ai" className="pt-2">
        <DeckBuilder embedded dueCount={dueCount} totalCount={totalCount} onGenerate={onGenerate} />
      </TabsContent>
      <TabsContent value="import" className="pt-2">
        <TextbookImport embedded existingTerms={existingTerms} onImport={onImport} />
      </TabsContent>
    </Tabs>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[88dvh] gap-0 rounded-t-3xl">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-lg font-bold">{TITLE}</SheetTitle>
            <SheetDescription className="font-medium">{DESCRIPTION}</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {tabs}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{TITLE}</DialogTitle>
          <DialogDescription className="font-medium">{DESCRIPTION}</DialogDescription>
        </DialogHeader>
        {tabs}
      </DialogContent>
    </Dialog>
  )
}
