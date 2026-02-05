import { useEffect, useState } from 'react'
import { getCachedImageUrl } from '../lib/imageCache'

export function useCachedImage(url?: string) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let active = true

    if (!url) {
      setCachedUrl(null)
      setLoading(false)
      return
    }

    setLoading(true)

    getCachedImageUrl(url)
      .then((resolvedUrl) => {
        if (active) {
          setCachedUrl(resolvedUrl)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setCachedUrl(url)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [url])

  return { cachedUrl, loading }
}
