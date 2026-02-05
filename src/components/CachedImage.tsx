import type { ImgHTMLAttributes } from 'react'
import { useCachedImage } from '../hooks/useCachedImage'

type CachedImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src?: string
}

export function CachedImage({ src, alt = '', width, height, ...rest }: CachedImageProps) {
  const { loading, ...imageProps } = rest
  const { cachedUrl } = useCachedImage(src)

  if (!src) return null

  return (
    <img
      src={cachedUrl || src}
      alt={alt}
      width={width}
      height={height}
      loading={loading ?? 'lazy'}
      {...imageProps}
    />
  )
}
