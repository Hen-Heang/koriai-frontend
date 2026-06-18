"use client"

import { useEffect, useState } from "react"

// These option lists (listening topics, message-generator categories) are static
// backend constants, so cache the first successful result for the whole session
// keyed by the fetcher reference (a stable singleton method). Subsequent mounts
// then render instantly and skip the network round-trip entirely.
const choicesCache = new Map<() => Promise<string[]>, string[]>()

// Fetches a list of options from the backend, keeping a hardcoded fallback
// (and its first entry selected) until real data arrives.
export function useChoices(fetcher: () => Promise<string[]>, fallback: string[]) {
  const cached = choicesCache.get(fetcher)
  const [options, setOptions] = useState<string[]>(cached ?? fallback)
  const [selected, setSelected] = useState<string>((cached ?? fallback)[0])

  useEffect(() => {
    // Already cached this session — no need to hit the backend again.
    if (choicesCache.has(fetcher)) return
    let active = true
    fetcher()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          choicesCache.set(fetcher, data)
          setOptions(data)
          setSelected(data[0])
        }
      })
      .catch(() => {
        /* keep fallback */
      })
    return () => {
      active = false
    }
  }, [fetcher])

  return { options, selected, setSelected }
}
