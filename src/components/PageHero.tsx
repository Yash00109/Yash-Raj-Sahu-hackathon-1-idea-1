import type { ReactNode } from 'react'
import type { VenueImage } from '../content/venue'
import { VenuePhoto } from './VenuePhoto'

interface PageHeroProps {
  eyebrow: string
  title: string
  lede: string
  image: VenueImage
  alt: string
  fallbackLabel: string
  objectPosition?: string
  children?: ReactNode
}

/** Shared cinematic header for interior pages; the photo drifts with scroll where the browser supports scroll-driven animation. */
export function PageHero({ eyebrow, title, lede, image, alt, fallbackLabel, objectPosition, children }: PageHeroProps) {
  return (
    <section className="page-hero" aria-labelledby="page-title">
      <div className="page-hero__media">
        <VenuePhoto image={image} alt={alt} fallbackLabel={fallbackLabel} priority objectPosition={objectPosition} />
      </div>
      <div className="page-hero__shade" aria-hidden="true" />
      <div className="container page-hero__inner">
        <p className="eyebrow eyebrow--on-dark page-hero__enter">{eyebrow}</p>
        <h1 className="page-hero__title page-hero__enter" id="page-title">
          {title}
        </h1>
        <p className="page-hero__lede page-hero__enter">{lede}</p>
        {children && <div className="page-hero__actions page-hero__enter">{children}</div>}
        {image.credit && <p className="page-hero__credit">{image.credit}</p>}
      </div>
    </section>
  )
}
