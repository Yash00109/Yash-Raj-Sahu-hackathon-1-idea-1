import { randomBytes, randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { madridDate, psql } from './localDb'
import { readLocalStack, type LocalStack } from './localStack'

// LOCAL STACK ONLY. The guest booking tracker (lookup-reservation Edge Function).

const ORIGIN = 'http://localhost:5180'
let stack: LocalStack
let reference: string
const PHONE = '+34 600 444 555'

// Random client addresses from a wide range, so repeated runs never share a rate-limit bucket.
const octet = () => Math.floor(Math.random() * 250) + 1
const client = () => `100.${octet()}.${octet()}.${octet()}`

const lookup = (body: unknown, ip = client()) =>
  fetch(`${stack.url}/functions/v1/lookup-reservation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, apikey: stack.anonKey, 'X-Forwarded-For': ip },
    body: JSON.stringify(body),
  })

beforeAll(async () => {
  stack = readLocalStack()
  const response = await fetch(`${stack.url}/functions/v1/create-reservation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, apikey: stack.anonKey, 'X-Forwarded-For': client() },
    body: JSON.stringify({ name: 'Tracker Guest', phone: PHONE, date: madridDate(30), time: '13:00', partySize: 3, seating: 'terrace', language: 'fr', notes: 'Private note', requestId: randomUUID() }),
  })
  expect(response.status).toBe(201)
  reference = (await response.json()).reservation.reference
})

describe('guest booking tracker', () => {
  it('returns only reference, date, time, party size and status for a matching reference and phone', async () => {
    const response = await lookup({ reference: reference.toLowerCase(), phone: '+34600444555' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      ok: true,
      reservation: { reference, date: madridDate(30), time: '13:00', partySize: 3, status: 'pending' },
    })
  })

  it('accepts the phone in another format and follows status changes', async () => {
    psql(`update public.reservations set status = 'confirmed' where reference = '${reference}';`)
    const response = await lookup({ reference, phone: '+34 600-444-555' })
    expect((await response.json()).reservation.status).toBe('confirmed')
  })

  it('answers a wrong phone and an unknown reference identically', async () => {
    const wrongPhone = await lookup({ reference, phone: '+34 600 444 556' })
    const unknown = await lookup({ reference: 'IT-' + randomBytes(6).toString('hex').toUpperCase(), phone: PHONE })
    expect([wrongPhone.status, unknown.status]).toEqual([404, 404])
    expect(await wrongPhone.text()).toBe(await unknown.text())
  })

  it('rejects malformed input and extra fields without looking anything up', async () => {
    for (const body of [{ reference: 'IT-12', phone: PHONE }, { reference, phone: '12' }, { reference }, { reference, phone: PHONE, id: 1 }, []]) {
      const response = await lookup(body)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ ok: false, error: 'invalid_request' })
    }
  })

  it('rate-limits repeated attempts from one client, including enumeration attempts', async () => {
    const ip = client()
    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      statuses.push((await lookup({ reference: 'IT-' + randomBytes(6).toString('hex').toUpperCase(), phone: PHONE }, ip)).status)
    }
    expect(statuses).toEqual([404, 404, 404, 404, 404, 404, 404, 404, 404, 404, 429])
    // Even the correct details are refused once the budget is spent.
    expect((await lookup({ reference, phone: PHONE }, ip)).status).toBe(429)
  })

  it('refuses other origins', async () => {
    const response = await fetch(`${stack.url}/functions/v1/lookup-reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example', apikey: stack.anonKey },
      body: JSON.stringify({ reference, phone: PHONE }),
    })
    expect(response.status).toBe(403)
  })
})
