import { BookingBand } from '../components/BookingBand'
import { Experiences } from '../components/Experiences'
import { Hero } from '../components/Hero'
import { Story } from '../components/Story'
import { venue } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import type { PageProps } from './types'

interface HomePageProps extends PageProps {
  interactive: boolean
  animateEntrance: boolean
}

export function HomePage({ t, s, interactive, animateEntrance }: HomePageProps) {
  useDocumentTitle(`${venue.name} · ${t.hero.titleLead} ${t.hero.titleAccent}`)

  return (
    <>
      <Hero t={t} interactive={interactive} animateEntrance={animateEntrance} />
      <Story t={t} s={s} />
      <Experiences t={t} s={s} />
      <BookingBand t={t} s={s} />
    </>
  )
}
