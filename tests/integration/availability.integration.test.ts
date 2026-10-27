import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { insertReservation, madridDate, psql } from './localDb'
import { readLocalStack, rest, type LocalStack } from './localStack'

// LOCAL STACK ONLY. Capacity rules are set to small test values here and restored afterwards.

let stack: LocalStack
const ORIGIN = 'http://localhost:5180'
const createdIds: string[] = []

const settings = (sql: string) => psql(`update public.booking_settings set ${sql};`)

const book = (date: string, time: string, partySize: number, requestId: string = randomUUID()) =>
  rest(stack, 'rpc/create_website_reservation', stack.serviceRoleKey, {
    method: 'POST',
    body: JSON.stringify({
      p_request_id: requestId,
      p_guest_name: 'Capacity Guest',
      p_phone: '+34600222333',
      p_reservation_date: date,
      p_reservation_time: time,
      p_party_size: partySize,
      p_seating_preference: 'indoor',
      p_preferred_language: 'en',
      p_notes: null,
    }),
  })

const availability = async (date: string, partySize: number) => {
  const response = await rest(stack, 'rpc/get_availability', stack.anonKey, { method: 'POST', body: JSON.stringify({ p_date: date, p_party_size: partySize }) })
  return response
}
const availableSlots = async (date: string, partySize: number) =>
  ((await availability(date, partySize)).body as { slot_time: string; available: boolean }[]).filter((s) => s.available).map((s) => s.slot_time)

const seatsOn = (date: string) => Number(psql(`select coalesce(sum(party_size), 0) from public.reservations where reservation_date = '${date}' and status in ('pending', 'confirmed');`))

beforeAll(() => {
  stack = readLocalStack()
  settings('capacity = 10, max_party_size = 10, duration_minutes = 120, min_lead_minutes = 0, max_advance_days = 180')
})

afterAll(() => {
  settings('capacity = 90, max_party_size = 90, duration_minutes = 120, min_lead_minutes = 60, max_advance_days = 180')
  psql(`delete from public.booking_closures;`)
})

describe('public availability', () => {
  it('lists the configured slots with a yes/no flag only', async () => {
    const date = madridDate(40)
    const response = await availability(date, 2)
    expect(response.status).toBe(200)
    expect(response.body.map((s: { slot_time: string }) => s.slot_time)).toEqual(['13:00', '13:30', '14:00', '14:30', '20:30', '21:00', '21:30'])
    for (const slot of response.body) expect(Object.keys(slot).sort()).toEqual(['available', 'slot_time'])
  })

  it('rejects invalid party sizes and returns nothing for closed dates', async () => {
    expect((await availability(madridDate(40), 0)).body).toMatchObject({ code: '22023', message: 'party_size_invalid' })
    expect((await availability(madridDate(40), 11)).body).toMatchObject({ code: '22023', message: 'party_size_invalid' })
    const closed = madridDate(41)
    psql(`insert into public.booking_closures (closed_on, note) values ('${closed}', 'test closure') on conflict do nothing;`)
    expect((await availability(closed, 2)).body).toEqual([])
    expect((await book(closed, '20:30', 2)).body).toMatchObject({ message: 'slot_not_offered' })
  })

  it('marks past slots and dates beyond the booking window as unavailable and refuses them', async () => {
    expect(await availableSlots(madridDate(-1), 2)).toEqual([])
    expect((await book(madridDate(-1), '20:30', 2)).body).toMatchObject({ message: 'slot_not_offered' })
    expect(await availableSlots(madridDate(200), 2)).toEqual([])
    expect((await book(madridDate(200), '20:30', 2)).body).toMatchObject({ message: 'slot_not_offered' })
    expect((await book(madridDate(42), '16:15', 2)).body).toMatchObject({ message: 'slot_not_offered' })
  })
})

describe('capacity limits', () => {
  it('accepts requests up to capacity, then refuses the slot and every overlapping slot', async () => {
    const date = madridDate(50)
    expect((await book(date, '20:30', 6)).status).toBe(200)
    expect((await book(date, '21:00', 4)).status).toBe(200)
    const full = await book(date, '20:30', 1)
    expect(full.body).toMatchObject({ code: 'P0001', message: 'slot_unavailable' })
    expect(seatsOn(date)).toBe(10)
    // 20:30 + 120 min overlaps 20:30, 21:00 and 21:30; lunch is unaffected.
    expect(await availableSlots(date, 1)).toEqual(['13:00', '13:30', '14:00', '14:30'])
  })

  it('refuses a party larger than the maximum', async () => {
    expect((await book(madridDate(51), '13:00', 11)).body).toMatchObject({ message: 'slot_unavailable' })
  })

  it('replays a repeated request id without taking more seats', async () => {
    const date = madridDate(52)
    const requestId = randomUUID()
    const first = await book(date, '13:00', 3, requestId)
    const second = await book(date, '13:00', 3, requestId)
    expect(first.body[0]).toMatchObject({ status: 'pending', replayed: false })
    expect(second.body[0]).toMatchObject({ reference: first.body[0].reference, replayed: true })
    expect(seatsOn(date)).toBe(3)
  })

  it('releases capacity on rejection and cancellation, but not on confirmation', async () => {
    const date = madridDate(53)
    for (let i = 0; i < 5; i++) expect((await book(date, '13:00', 2)).status).toBe(200)
    expect(await availableSlots(date, 1)).not.toContain('13:00')

    const ids = psql(`select string_agg(id::text, ',' order by created_at) from public.reservations where reservation_date = '${date}';`).split(',')
    psql(`update public.reservations set status = 'confirmed' where id = '${ids[0]}';`)
    expect(await availableSlots(date, 1)).not.toContain('13:00')

    psql(`update public.reservations set status = 'rejected' where id = '${ids[1]}';`)
    psql(`update public.reservations set status = 'cancelled' where id = '${ids[2]}';`)
    expect(seatsOn(date)).toBe(6)
    expect(await availableSlots(date, 4)).toContain('13:00')
    expect((await book(date, '13:00', 4)).status).toBe(200)
    expect((await book(date, '13:00', 1)).body).toMatchObject({ message: 'slot_unavailable' })
  })

  it('applies a lowered capacity to new requests without touching existing ones', async () => {
    const date = madridDate(54)
    expect((await book(date, '14:00', 8)).status).toBe(200)
    settings('capacity = 5, max_party_size = 5')
    try {
      expect((await book(date, '14:00', 1)).body).toMatchObject({ message: 'slot_unavailable' })
      expect(seatsOn(date)).toBe(8)
    } finally {
      settings('capacity = 10, max_party_size = 10')
    }
  })
})

describe('concurrent conflicting submissions', () => {
  it('never exceeds capacity when 25 requests race for the same slot', async () => {
    const date = madridDate(60)
    const results = await Promise.all(Array.from({ length: 25 }, () => book(date, '20:30', 1)))
    const accepted = results.filter((r) => r.status === 200).length
    const refused = results.filter((r) => r.body?.message === 'slot_unavailable').length
    expect([accepted, refused]).toEqual([10, 15])
    expect(seatsOn(date)).toBe(10)
  })

  it('never exceeds capacity when parties of different sizes race for overlapping slots', async () => {
    const date = madridDate(61)
    const requests = [['20:30', 4], ['21:00', 4], ['21:30', 4], ['20:30', 3], ['21:00', 3], ['21:30', 2], ['20:30', 2]] as const
    await Promise.all(requests.map(([time, size]) => book(date, time, size)))
    // Every pair of these slots overlaps within 120 minutes, so the total held stays within 10.
    expect(seatsOn(date)).toBeLessThanOrEqual(10)
  })

  it('holds through the public Edge Function as well', async () => {
    const date = madridDate(62)
    settings('capacity = 4, max_party_size = 4')
    try {
      const submit = (i: number) =>
        fetch(`${stack.url}/functions/v1/create-reservation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: ORIGIN, apikey: stack.anonKey, 'X-Forwarded-For': `198.18.${i}.${Math.floor(Math.random() * 250) + 1}` },
          body: JSON.stringify({ name: 'Race Guest', phone: '+34 600 333 444', date, time: '13:30', partySize: 1, seating: 'terrace', language: 'eu', notes: '', requestId: randomUUID() }),
        })
      const statuses = (await Promise.all(Array.from({ length: 9 }, (_, i) => submit(i)))).map((r) => r.status).sort()
      expect(statuses).toEqual([201, 201, 201, 201, 409, 409, 409, 409, 409])
      expect(seatsOn(date)).toBe(4)
    } finally {
      settings('capacity = 10, max_party_size = 10')
    }
  })
})

describe('other write paths', () => {
  it('the service role cannot insert reservations directly any more', async () => {
    const direct = await rest(stack, 'reservations', stack.serviceRoleKey, {
      method: 'POST',
      body: JSON.stringify({ guest_name: 'Bypass', phone: '+34600999888', reservation_date: madridDate(70), reservation_time: '20:30', party_size: 50, preferred_language: 'es' }),
    })
    expect(direct.body).toMatchObject({ code: '42501' })
  })

  it('anon cannot call the booking or lookup functions directly', async () => {
    const anonBook = await rest(stack, 'rpc/create_website_reservation', stack.anonKey, { method: 'POST', body: JSON.stringify({ p_request_id: randomUUID() }) })
    expect([401, 403, 404]).toContain(anonBook.status)
    const anonLookup = await rest(stack, 'rpc/lookup_reservation', stack.anonKey, { method: 'POST', body: JSON.stringify({ p_reference: 'IT-00000000', p_phone: '+34600000000' }) })
    expect([401, 403, 404]).toContain(anonLookup.status)
  })

  it('staff phone bookings respect the same capacity', async () => {
    const email = `cap-${randomUUID()}@example.test`
    const password = `Pw-${randomUUID()}`
    const admin = createClient(stack.url, stack.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    const userId = data.user!.id
    psql(`insert into public.staff_users (user_id) values ('${userId}');`)
    const staff = createClient(stack.url, stack.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    await staff.auth.signInWithPassword({ email, password })

    const date = madridDate(71)
    createdIds.push(insertReservation({ reservation_date: date, reservation_time: '19:00', party_size: 9 }))
    const call = (size: number) =>
      staff.rpc('staff_create_phone_reservation', {
        p_guest_name: 'Phone Cap', p_phone: '+34622000111', p_reservation_date: date, p_reservation_time: '19:30',
        p_party_size: size, p_seating_preference: 'indoor', p_preferred_language: 'es',
      })
    expect((await call(2)).error).toMatchObject({ code: 'P0001', message: 'slot_unavailable' })
    const ok = await call(1)
    expect(ok.error).toBeNull()
    expect(ok.data).toMatchObject({ source: 'phone', created_by: userId, status: 'confirmed' })
    psql(`delete from public.reservations where created_by = '${userId}' or status_changed_by = '${userId}';`)
    await admin.auth.admin.deleteUser(userId)
  })
})
