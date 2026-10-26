import { useState } from 'react'
import type { VenueImage } from '../content/venue'

interface VenuePhotoProps {
  image: VenueImage
  alt: string
  fallbackLabel: string
  className?: string
  priority?: boolean
  sizes?: string
  objectPosition?: string
}

/** Venue photograph that degrades to a styled, labelled panel if the file fails to load. */
export function VenuePhoto({
  image,
  alt,
  fallbackLabel,
  className = '',
  priority = false,
  sizes,
  objectPosition,
}: VenuePhotoProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`photo photo--fallback ${className}`} role="img" aria-label={alt}>
        <span className="photo__fallback-label" aria-hidden="true">
          {fallbackLabel}
        </span>
      </div>
    )
  }

  return (
    <img
      className={`photo ${className}`}
      src={image.src}
      width={image.width}
      height={image.height}
      alt={alt}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      style={objectPosition ? { objectPosition } : undefined}
      onError={() => setFailed(true)}
    />
  )
}
