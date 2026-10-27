import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { insertReservation, psql } from './localDb'
import { readLocalStack, type LocalStack } from './localStack'

let stack: LocalStack
let admin: SupabaseClient
const userIds: string[] = []
const reservationIds: string[] = []
const password = `Pw-${randomUUID()}`

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } }

async function createUser(staff: false | { active: boolean }) {
  const email = `it-${randomUUID()}@example.test`
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  userIds.push(data.user.id)
  // Staff membership is administered by the database owner; no API role can write staff_users.
  if (staff) psql(`insert into public.staff_users (user_id, active) values ('${data.user.id}', ${staff.active});`)
  const client = createClient(stack.url, stack.anonKey, clientOptions)
  const { error: signInError } = await client.auth.signInWithPassword({ email, password })
  if (signInError) throw signInError
  return { id: data.user.id, client }
}

// Seeded as the database owner: since migration 0002 no API role may insert directly.
async function seedReservation(overrides: Record<string, string | number> = {}) {
  const id = insertReservation({ reservation_date: '2031-03-07', reservation_time: '21:00', party_size: 4, preferred_language: 'fr', ...overrides })
  reservationIds.push(id)
  return { id, reference: psql(`select reference from public.reservations where id = '${id}';`) }
}

const phoneBooking = (overrides: Record<string, unknown> = {}) => ({
  p_guest_name: '  Ane   Phone ',
  p_phone: '+34622333444',
  p_reservation_date: '2031-03-08',
  p_reservation_time: '14:00',
  p_party_size: 10,
  p_seating_preference: 'terrace',
  p_preferred_language: 'eu',
  p_notes: 'Called at noon',
  ...overrides,
})

let staff: Awaited<ReturnType<typeof createUser>>
let inactiveStaff: Awaited<ReturnType<typeof createUser>>
let outsider: Awaited<ReturnType<typeof createUser>>

beforeAll(async () => {
  stack = readLocalStack()
  admin = createClient(stack.url, stack.serviceRoleKey, clientOptions)
  staff = await createUser({ active: true })
  inactiveStaff = await createUser({ active: false })
  outsider = await createUser(false)
})

// Test data is removed as the local database owner: no API role can delete reservations.
afterAll(async () => {
  if (!admin || userIds.length === 0) return
  const ids = userIds.map((id) => `'${id}'`).join(',')
  const seeded = reservationIds.map((id) => `'${id}'`).join(',') || 'null'
  psql(`delete from public.reservations where id in (${seeded}) or created_by in (${ids}) or status_changed_by in (${ids});`)
  for (const id of userIds) await admin.auth.admin.deleteUser(id)
})

describe('staff accounts', () => {
  it('cannot be created through public sign-up', async () => {
    const anon = createClient(stack.url, stack.anonKey, clientOptions)
    const { data, error } = await anon.auth.signUp({ email: `it-${randomUUID()}@example.test`, password })
    if (data.user) userIds.push(data.user.id)
    expect(error).not.toBeNull()
    expect(data.user).toBeNull()
  })

  it('reports staff membership only for active staff', async () => {
    expect((await staff.client.rpc('is_current_user_staff')).data).toBe(true)
    expect((await inactiveStaff.client.rpc('is_current_user_staff')).data).toBe(false)
    expect((await outsider.client.rpc('is_current_user_staff')).data).toBe(false)
  })

  it('cannot be self-granted by a signed-in non-staff user', async () => {
    const { error } = await outsider.client.from('staff_users').insert({ user_id: outsider.id })
    expect(error?.code).toBe('42501')
    expect((await outsider.client.rpc('is_current_user_staff')).data).toBe(false)
  })
})

describe('reservation access for signed-in users who are not staff', () => {
  it('sees no reservations and cannot change or create any', async () => {
    const seeded = await seedReservation()
    for (const user of [outsider, inactiveStaff]) {
      const { data, error } = await user.client.from('reservations').select('id')
      expect(error).toBeNull()
      expect(data).toEqual([])
      const transition = await user.client.rpc('staff_set_reservation_status', { p_reservation_id: seeded.id, p_status: 'confirmed' })
      expect(transition.error?.code).toBe('42501')
      const booking = await user.client.rpc('staff_create_phone_reservation', phoneBooking())
      expect(booking.error?.code).toBe('42501')
    }
    const { data } = await admin.from('reservations').select('status').eq('id', seeded.id).single()
    expect(data?.status).toBe('pending')
  })
})

describe('reservation access for staff', () => {
  it('lists and filters reservations', async () => {
    const seeded = await seedReservation({ reservation_date: '2031-04-01', guest_name: 'Filter Target' })
    const { data, error } = await staff.client
      .from('reservations')
      .select('id, reference, status')
      .eq('reservation_date', '2031-04-01')
      .eq('status', 'pending')
      .ilike('guest_name', '%filter target%')
    expect(error).toBeNull()
    expect(data).toContainEqual({ id: seeded.id, reference: seeded.reference, status: 'pending' })
  })

  it('follows the allowed status transitions and records who changed them', async () => {
    const seeded = await seedReservation()
    const set = (status: string) => staff.client.rpc('staff_set_reservation_status', { p_reservation_id: seeded.id, p_status: status })

    const nullStatus = await staff.client.rpc('staff_set_reservation_status', { p_reservation_id: seeded.id, p_status: null })
    expect(nullStatus.error).toMatchObject({ code: '22004', message: 'status_required' })
    const nullId = await staff.client.rpc('staff_set_reservation_status', { p_reservation_id: null, p_status: 'confirmed' })
    expect(nullId.error).toMatchObject({ code: '22004', message: 'reservation_id_required' })

    const confirmed = await set('confirmed')
    expect(confirmed.error).toBeNull()
    expect(confirmed.data).toMatchObject({ status: 'confirmed', status_changed_by: staff.id })
    expect(new Date(confirmed.data.updated_at).getTime()).toBeGreaterThan(new Date(confirmed.data.created_at).getTime())
    expect((await set('pending')).error?.code).toBe('22023')
    expect((await set('rejected')).error?.code).toBe('22023')
    expect((await set('cancelled')).data).toMatchObject({ status: 'cancelled' })
    expect((await set('confirmed')).error?.code).toBe('22023')

    const rejected = await seedReservation()
    expect((await staff.client.rpc('staff_set_reservation_status', { p_reservation_id: rejected.id, p_status: 'rejected' })).data).toMatchObject({ status: 'rejected' })
    expect((await staff.client.rpc('staff_set_reservation_status', { p_reservation_id: rejected.id, p_status: 'confirmed' })).error?.code).toBe('22023')
  })

  it('cannot bypass the status rules or delete reservations with direct table writes', async () => {
    const seeded = await seedReservation()
    expect((await staff.client.from('reservations').update({ status: 'confirmed' }).eq('id', seeded.id)).error?.code).toBe('42501')
    expect((await staff.client.from('reservations').delete().eq('id', seeded.id)).error?.code).toBe('42501')
    expect((await staff.client.from('reservations').insert({ guest_name: 'Xa', phone: '+34600000000', reservation_date: '2031-01-01', reservation_time: '13:00', party_size: 2, seating_preference: 'indoor', preferred_language: 'es' })).error?.code).toBe('42501')
    const { data } = await admin.from('reservations').select('status').eq('id', seeded.id).single()
    expect(data?.status).toBe('pending')
  })

  it('records phone bookings with their source and the staff member', async () => {
    const { data, error } = await staff.client.rpc('staff_create_phone_reservation', phoneBooking())
    expect(error).toBeNull()
    reservationIds.push(data.id)
    expect(data).toMatchObject({
      guest_name: 'Ane Phone',
      source: 'phone',
      status: 'confirmed',
      created_by: staff.id,
      notes: 'Called at noon',
      request_id: null,
    })

    const pending = await staff.client.rpc('staff_create_phone_reservation', phoneBooking({ p_status: 'pending', p_notes: '  ' }))
    expect(pending.data).toMatchObject({ status: 'pending', notes: null })
    reservationIds.push(pending.data.id)
  })

  it('rejects invalid phone bookings at the database', async () => {
    // Since 0002 the capacity check (max party 90) refuses this before the insert trigger does.
    expect((await staff.client.rpc('staff_create_phone_reservation', phoneBooking({ p_party_size: 91 }))).error).toMatchObject({ code: 'P0001', message: 'slot_unavailable' })
    expect((await staff.client.rpc('staff_create_phone_reservation', phoneBooking({ p_preferred_language: 'it' }))).error?.code).toBe('23514')
    expect((await staff.client.rpc('staff_create_phone_reservation', phoneBooking({ p_phone: 'call me' }))).error?.code).toBe('23514')
    expect((await staff.client.rpc('staff_create_phone_reservation', phoneBooking({ p_guest_name: 'A' }))).error?.code).toBe('23514')
    expect((await staff.client.rpc('staff_create_phone_reservation', phoneBooking({ p_status: 'cancelled' }))).error?.code).toBe('22023')
    expect((await staff.client.rpc('staff_create_phone_reservation', phoneBooking({ p_status: null }))).error).toMatchObject({ code: '22004', message: 'status_required' })
  })
})
