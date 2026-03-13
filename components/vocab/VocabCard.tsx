import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { VocabItem } from "@/lib/types"

type VocabCardProps = {
  item: VocabItem
  onReview?: (id: string) => void
}

export function VocabCard({ item, onReview }: VocabCardProps) {
  return (
    <Card className="rounded-3xl border-border/60 bg-white/90 shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{item.term}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{item.meaning}</p>
          </div>
          <Badge variant="outline">{item.mastery}% mastered</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="rounded-2xl bg-muted/70 p-3 text-foreground">{item.example}</p>
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Next review: {item.nextReview}
        </span>
        {onReview ? (
          <Button variant="outline" size="sm" onClick={() => onReview(item.id)}>
            Mark reviewed
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
