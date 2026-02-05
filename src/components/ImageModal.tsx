import { useEffect } from 'react'
import { CachedImage } from './CachedImage'

type ImageModalProps = {
  src: string
  alt: string
  caption?: string
  onClose: () => void
}

export function ImageModal({ src, alt, caption, onClose }: ImageModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-content"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <CachedImage src={src} alt={alt} className="modal-image" />
        <div className="modal-meta">
          <p>{caption}</p>
          <button className="btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
