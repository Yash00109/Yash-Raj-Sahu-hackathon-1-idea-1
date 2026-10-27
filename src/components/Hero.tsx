import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { venueImages } from '../content/venue'
import type { Copy } from '../i18n/copy'
import { RESERVATION_HREF } from '../routes'
import { VenuePhoto } from './VenuePhoto'

const step = (index: number) => ({ '--i': index }) as CSSProperties

interface HeroProps {
  t: Copy
  interactive: boolean
  /** False under reduced motion: the copy renders without entrance classes or stagger delays. */
  animateEntrance: boolean
}

/**
 * The depth stage is plain CSS transforms driven by two custom properties
 * (--px / --py, range -1..1). It is the placeholder for the later 3D scene, so
 * the booking path never depends on it.
 */
export function Hero({ t, interactive, animateEntrance }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const enterClass = animateEntrance ? ' hero__enter' : ''
  const enterStyle = (index: number) => (animateEntrance ? step(index) : undefined)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    if (!interactive || !section || !stage) return

    let frame = 0
    let x = 0
    let y = 0
    const apply = () => {
      frame = 0
      stage.style.setProperty('--px', x.toFixed(3))
      stage.style.setProperty('--py', y.toFixed(3))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }
    const onMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect()
      x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      y = ((event.clientY - rect.top) / rect.height) * 2 - 1
      schedule()
    }
    const onLeave = () => {
      x = 0
      y = 0
      schedule()
    }

    section.addEventListener('pointermove', onMove)
    section.addEventListener('pointerleave', onLeave)
    return () => {
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(frame)
      stage.style.removeProperty('--px')
      stage.style.removeProperty('--py')
    }
  }, [interactive])

  return (
    <section className="hero" id="inicio" ref={sectionRef} aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />

      <div className="hero__inner">
        <div className="hero__copy">
          <p className={`eyebrow eyebrow--on-dark${enterClass}`} style={enterStyle(0)}>
            {t.hero.eyebrow}
          </p>
          <h1 className="hero__title" id="hero-title">
            <span className={`hero__line${enterClass}`} style={enterStyle(1)}>
              {t.hero.titleLead}
            </span>
            <span className={`hero__line hero__line--accent${enterClass}`} style={enterStyle(2)}>
              {t.hero.titleAccent}
            </span>
          </h1>
          <p className={`hero__lede${enterClass}`} style={enterStyle(3)}>
            {t.hero.lede}
          </p>
          <div className={`hero__ctas${enterClass}`} style={enterStyle(4)}>
            <Link className="btn btn--primary btn--large" to={RESERVATION_HREF}>
              {t.hero.primaryCta}
              <span className="btn__arrow" aria-hidden="true">→</span>
            </Link>
            <a className="btn btn--ghost-light" href="#historia">
              {t.hero.secondaryCta}
            </a>
          </div>
        </div>

        <div className="stage" ref={stageRef}>
          <svg className="stage__rings stage__layer" data-depth="1" viewBox="0 0 400 400" aria-hidden="true">
            {[196, 168, 140, 112, 84].map((r) => (
              <circle key={r} cx="200" cy="200" r={r} />
            ))}
          </svg>

          <figure className="stage__frame stage__frame--back stage__layer" data-depth="2">
            <div className="stage__photo">
              <VenuePhoto
                image={venueImages.caserioStone}
                alt={t.hero.captionStone}
                fallbackLabel={t.imageUnavailable}
                priority
                sizes="(max-width: 900px) 80vw, 40vw"
                objectPosition="58% 50%"
              />
            </div>
            <figcaption className="stage__caption">
              {t.hero.captionStone}
              <span className="stage__credit"> · {venueImages.caserioStone.credit}</span>
            </figcaption>
          </figure>

          <figure className="stage__frame stage__frame--front stage__layer" data-depth="3">
            <div className="stage__photo">
              <VenuePhoto
                image={venueImages.kupelas}
                alt={t.hero.captionKupelas}
                fallbackLabel={t.imageUnavailable}
                className="photo--trim-top"
                priority
                sizes="(max-width: 900px) 50vw, 22vw"
                objectPosition="50% 30%"
              />
            </div>
            <figcaption className="stage__caption">{t.hero.captionKupelas}</figcaption>
          </figure>

          <p className="stage__chip stage__layer" data-depth="4" aria-hidden="true">
            <span>{t.hero.chip}</span>
          </p>
        </div>
      </div>

      <dl className="hero__facts">
        {t.hero.facts.map((fact) => (
          <div className="hero__fact" key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
