import { timingSafeEqual } from 'node:crypto'
export function validCode(code: string) {
  const expected = process.env.OLLIE_CARD_CODE
  if (!expected || expected.length < 20 || !/^[A-Za-z0-9_-]+$/.test(code)) return false
  const a = Buffer.from(code), b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
