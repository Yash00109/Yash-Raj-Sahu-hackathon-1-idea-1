import { describe, expect, it } from 'vitest'
import {
  canTransition,
  isInPast,
  LIMITS,
  normalizePhone,
  STATUSES,
  validateReservationRequest,
  venueNow,
  type FieldError,
} from '../../supabase/functions/_shared/reservation.ts'

// 27 Oct 2026, 10:00 UTC = 11:00 in Madrid (CET after the October DST change).
const NOW = new Date('2026-10-27T10:00:00Z')

const valid = {
  name: '  Miren   Etxeberria ',
  phone: ' +34 685 72 15 93 ',
  date: '2026-10-29',
  time: '13:30',
  partySize: 6,
  seating: 'terrace',
  language: 'eu',
  notes: '  Mahai bat leiho ondoan  ',
  requestId: '3f2b1a9e-8c4d-4e5f-9a6b-7c8d9e0f1a2b',
}

const codes = (input: unknown) => {
  const result = validateReservationRequest(input, NOW)
  return result.ok ? [] : result.errors.map((e: FieldError) => `${e.field}:${e.code}`)
}

describe('validateReservationRequest', () => {
  it('accepts a valid request and normalizes it', () => {
    const result = validateReservationRequest(valid, NOW)
    expect(result).toEqual({
      ok: true,
      value: {
        name: 'Miren Etxeberria',
        phone: '+34685721593',
        date: '2026-10-29',
        time: '13:30',
        partySize: 6,
        seating: 'terrace',
        language: 'eu',
        notes: 'Mahai bat leiho ondoan',
        requestId: '3f2b1a9e-8c4d-4e5f-9a6b-7c8d9e0f1a2b',
      },
    })
  })

  it('treats empty optional notes and a missing request id as null', () => {
    const result = validateReservationRequest({ ...valid, notes: '   ', requestId: undefined }, NOW)
    expect(result.ok && result.value.notes).toBeNull()
    expect(result.ok && result.value.requestId).toBeNull()
  })

  it.each([
    ['missing payload', null, ['_request:not_an_object']],
    ['array payload', [valid], ['_request:not_an_object']],
    ['empty name', { ...valid, name: '' }, ['name:name_required']],
    ['whitespace-only name', { ...valid, name: ' \t\n ' }, ['name:name_required']],
    ['punctuation-only name', { ...valid, name: '...' }, ['name:name_required']],
    ['oversized name', { ...valid, name: 'a'.repeat(LIMITS.nameMax + 1) }, ['name:name_too_long']],
    ['one-letter name', { ...valid, name: ' A ' }, ['name:name_too_short']],
    ['whitespace-only phone', { ...valid, phone: '   ' }, ['phone:phone_required']],
    ['phone with letters', { ...valid, phone: '685-ABC-593' }, ['phone:phone_invalid']],
    ['phone too short', { ...valid, phone: '12345' }, ['phone:phone_invalid']],
    ['phone too long', { ...valid, phone: '+1234567890123456' }, ['phone:phone_invalid']],
    ['impossible date', { ...valid, date: '2026-02-30' }, ['date:date_invalid']],
    ['malformed date', { ...valid, date: '29/10/2026' }, ['date:date_invalid']],
    ['malformed time', { ...valid, time: '25:00' }, ['time:time_invalid']],
    ['time without minutes', { ...valid, time: '13' }, ['time:time_invalid']],
    ['past date', { ...valid, date: '2026-10-26' }, ['date:date_in_past']],
    ['earlier today in Madrid', { ...valid, date: '2026-10-27', time: '10:59' }, ['date:date_in_past']],
    ['zero guests', { ...valid, partySize: 0 }, ['partySize:party_size_invalid']],
    ['fractional guests', { ...valid, partySize: 2.5 }, ['partySize:party_size_invalid']],
    ['guests as a string', { ...valid, partySize: '4' }, ['partySize:party_size_invalid']],
    ['more guests than published capacity', { ...valid, partySize: LIMITS.partySizeMax + 1 }, ['partySize:party_size_too_large']],
    ['unknown seating', { ...valid, seating: 'vip' }, ['seating:seating_invalid']],
    ['unknown language', { ...valid, language: 'it' }, ['language:language_invalid']],
    ['oversized notes', { ...valid, notes: 'x'.repeat(LIMITS.notesMax + 1) }, ['notes:notes_too_long']],
    ['notes with control characters', { ...valid, notes: 'hi\u0000' }, ['notes:notes_invalid']],
    ['malformed request id', { ...valid, requestId: 'not-a-uuid' }, ['requestId:request_id_invalid']],
  ])('rejects %s', (_label, input, expected) => {
    expect(codes(input)).toEqual(expected)
  })

  it.each([
    ['status', { status: 'confirmed' }],
    ['source', { source: 'phone' }],
    ['staff identity', { created_by: '00000000-0000-0000-0000-000000000000' }],
    ['id', { id: 1 }],
  ])('rejects a client-supplied %s field', (_label, extra) => {
    expect(codes({ ...valid, ...extra })).toContain('_request:unknown_field')
  })

  it('accepts every supported language and both seating preferences', () => {
    for (const language of ['eu', 'es', 'fr', 'en', 'de']) {
      for (const seating of ['indoor', 'terrace']) {
        expect(validateReservationRequest({ ...valid, language, seating }, NOW).ok).toBe(true)
      }
    }
  })
})

describe('timezone policy', () => {
  it('reads the current time in Madrid, not the machine timezone', () => {
    expect(venueNow(NOW)).toEqual({ date: '2026-10-27', time: '11:00' })
  })

  it('treats the current minute as past and the next minute as future', () => {
    expect(isInPast('2026-10-27', '11:00', NOW)).toBe(true)
    expect(isInPast('2026-10-27', '11:01', NOW)).toBe(false)
  })

  it('handles the date boundary in Madrid (23:30 UTC is already the next day)', () => {
    const lateNight = new Date('2026-10-27T23:30:00Z')
    expect(venueNow(lateNight)).toEqual({ date: '2026-10-28', time: '00:30' })
    expect(isInPast('2026-10-27', '23:59', lateNight)).toBe(true)
  })
})

describe('normalizePhone', () => {
  it.each([
    ['685 72 15 93', '685721593'],
    ['+34 685-72-15-93', '+34685721593'],
    ['(0049) 30 1234 5678', '00493012345678'],
    ['+1 (415) 555.0199', '+14155550199'],
  ])('accepts %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })
})

describe('status transitions', () => {
  it('allows only the documented staff transitions', () => {
    const allowed = STATUSES.flatMap((from) => STATUSES.filter((to) => canTransition(from, to)).map((to) => `${from}->${to}`))
    expect(allowed).toEqual(['pending->confirmed', 'pending->rejected', 'pending->cancelled', 'confirmed->cancelled'])
  })
})
