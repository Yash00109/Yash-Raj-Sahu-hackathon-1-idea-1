import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { BackendConfig } from '../config'
import { venueNow, type ReservationLanguage, type ReservationSource, type ReservationStatus, type Seating } from '../../supabase/functions/_shared/reservation.ts'

export interface StaffReservation {
  id: string
  reference: string
  guest_name: string
  phone: string
  reservation_date: string
  reservation_time: string
  party_size: number
  seating_preference: Seating
  preferred_language: ReservationLanguage
  notes: string | null
  status: ReservationStatus
  /** NULL for rows recorded before the reservation-backend migration (origin unknown). */
  source: ReservationSource | null
  created_at: string
}

export interface ReservationFilters {
  /** Exact date, or '' for upcoming reservations (today onwards, venue time). */
  date: string
  status: ReservationStatus | ''
  search: string
}

export interface PhoneBookingInput {
  name: string
  phone: string
  date: string
  time: string
  partySize: number
  seating: Seating
  language: ReservationLanguage
  notes: string | null
  status: 'pending' | 'confirmed'
}

export type StaffErrorCode = 'not_staff' | 'invalid_transition' | 'invalid_input' | 'slot_full' | 'network' | 'unknown'

export class StaffApiError extends Error {
  readonly code: StaffErrorCode
  constructor(code: StaffErrorCode) {
    super(code)
    this.code = code
  }
}

export interface StaffApi {
  getSessionEmail(): Promise<string | null>
  onSessionChange(listener: (email: string | null) => void): () => void
  signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: 'invalid_credentials' | 'network' }>
  signOut(): Promise<void>
  isStaff(): Promise<boolean>
  listReservations(filters: ReservationFilters): Promise<StaffReservation[]>
  setStatus(id: string, status: ReservationStatus): Promise<StaffReservation>
  createPhoneReservation(input: PhoneBookingInput): Promise<StaffReservation>
}

export const LIST_LIMIT = 200

const COLUMNS =
  'id, reference, guest_name, phone, reservation_date, reservation_time, party_size, seating_preference, preferred_language, notes, status, source, created_at'

/** Characters that could change the meaning of a PostgREST filter are dropped, not escaped. */
export function searchFilter(search: string): string | null {
  const term = search.replace(/[^\p{L}\p{N}\s'+-]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!term) return null
  const digits = term.replace(/\D/g, '')
  const clauses = [`guest_name.ilike."*${term}*"`]
  if (digits.length >= 3) clauses.push(`phone.ilike."*${digits}*"`)
  return clauses.join(',')
}

function toError(error: { code?: string; message?: string } | null): StaffApiError {
  if (error?.message === 'slot_unavailable') return new StaffApiError('slot_full')
  switch (error?.code) {
    case '42501':
      return new StaffApiError('not_staff')
    case '22023':
    case 'P0002':
      return new StaffApiError('invalid_transition')
    case '23514':
    case '22004':
    case '22007':
    case '22008':
    case '22P02':
      return new StaffApiError('invalid_input')
    default:
      return new StaffApiError(error?.message?.includes('fetch') ? 'network' : 'unknown')
  }
}

const trimTime = (row: StaffReservation): StaffReservation => ({ ...row, reservation_time: row.reservation_time.slice(0, 5) })

export function createStaffApi(config: BackendConfig, client: SupabaseClient = createClient(config.url, config.publishableKey)): StaffApi {
  return {
    async getSessionEmail() {
      const { data } = await client.auth.getSession()
      return data.session?.user.email ?? null
    },
    onSessionChange(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) => listener(session?.user.email ?? null))
      return () => data.subscription.unsubscribe()
    },
    async signIn(email, password) {
      try {
        const { error } = await client.auth.signInWithPassword({ email, password })
        if (!error) return { ok: true }
        return { ok: false, error: error.status && error.status < 500 ? 'invalid_credentials' : 'network' }
      } catch {
        return { ok: false, error: 'network' }
      }
    },
    async signOut() {
      await client.auth.signOut()
    },
    async isStaff() {
      const { data, error } = await client.rpc('is_current_user_staff')
      if (error) throw toError(error)
      return data === true
    },
    async listReservations({ date, status, search }) {
      let query = client.from('reservations').select(COLUMNS)
      query = date ? query.eq('reservation_date', date) : query.gte('reservation_date', venueNow().date)
      if (status) query = query.eq('status', status)
      const filter = searchFilter(search)
      if (filter) query = query.or(filter)
      const { data, error } = await query
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true })
        .limit(LIST_LIMIT)
      if (error) throw toError(error)
      return (data as StaffReservation[]).map(trimTime)
    },
    async setStatus(id, status) {
      const { data, error } = await client.rpc('staff_set_reservation_status', { p_reservation_id: id, p_status: status })
      if (error) throw toError(error)
      return trimTime(data as StaffReservation)
    },
    async createPhoneReservation(input) {
      const { data, error } = await client.rpc('staff_create_phone_reservation', {
        p_guest_name: input.name,
        p_phone: input.phone,
        p_reservation_date: input.date,
        p_reservation_time: input.time,
        p_party_size: input.partySize,
        p_seating_preference: input.seating,
        p_preferred_language: input.language,
        p_notes: input.notes,
        p_status: input.status,
      })
      if (error) throw toError(error)
      return trimTime(data as StaffReservation)
    },
  }
}
