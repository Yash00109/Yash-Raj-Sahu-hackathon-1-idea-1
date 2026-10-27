import { PageHero } from '../components/PageHero'
import { Reservation } from '../components/Reservation'
import { venue, venueImages } from '../content/venue'
import { useDocumentTitle } from '../hooks/usePageTitle'
import type { PageProps } from './types'

export function ReservationsPage({ t, s, lang }: PageProps) {
  useDocumentTitle(`${s.reservationsPage.title} · ${venue.name}`)

  return (
    <>
      <PageHero
        eyebrow={t.reserve.eyebrow}
        title={s.reservationsPage.title}
        lede={s.reservationsPage.lede}
        image={venueImages.diningRoom}
        alt={t.reserve.form.indoorAlt}
        fallbackLabel={t.imageUnavailable}
        objectPosition="50% 60%"
      />
      <Reservation t={t} lang={lang} />
    </>
  )
}
