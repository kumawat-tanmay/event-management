'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function AutoScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Scroll to top instantly when the route path changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    })
  }, [pathname])

  return null
}
