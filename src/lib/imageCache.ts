const memoryCache = new Map<string, string>()

async function cacheImage(url: string) {
  if (memoryCache.has(url)) {
    return memoryCache.get(url) as string
  }

  if (!('caches' in window)) {
    return url
  }

  try {
    const cache = await caches.open('sjmsom-image-cache-v1')
    const cached = await cache.match(url)

    if (cached) {
      const blob = await cached.blob()
      const objectUrl = URL.createObjectURL(blob)
      memoryCache.set(url, objectUrl)
      return objectUrl
    }

    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) {
      return url
    }

    await cache.put(url, response.clone())
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    memoryCache.set(url, objectUrl)
    return objectUrl
  } catch (error) {
    return url
  }
}

export async function getCachedImageUrl(url: string) {
  return cacheImage(url)
}
