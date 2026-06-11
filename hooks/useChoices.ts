"use client"

import { useEffect, useState } from "react"

// Fetches a list of options from the backend, keeping a hardcoded fallback
// (and its first entry selected) until real data arrives.
export function useChoices(fetcher: () => Promise<string[]>, fallback: string[]) {
  const [options, setOptions] = useState<string[]>(fallback)
  const [selected, setSelected] = useState<string>(fallback[0])

  useEffect(() => {
    let active = true
    fetcher()
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { options, selected, setSelected }
}
