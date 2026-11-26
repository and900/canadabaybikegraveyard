import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './client'
import {
  addRecipients,
  allowLoginTry,
  cardByCode,
  cardCounts,
  cardCountsByDay,
  countCardEvent,
  deleteRecipient,
  getCardSettings,
  listRecipients,
  markOpened,
  saveCardSettings,
  updateRecipient,
} from './cards'

beforeEach(async () => {
  await db.$executeRaw`DELETE FROM card_recipients`
  await db.$executeRaw`DELETE FROM card_counts`
  await db.$executeRaw`DELETE FROM rate_counters WHERE key LIKE 'cards-login:%'`
  await saveCardSettings({ message: 'Merry Christmas', signoff: 'With love, A', theme: 'midnight' })
})

describe('card settings', () => {
  it('saves the shared words and theme, and refuses empty ones', async () => {
    expect(await saveCardSettings({ message: 'Hi', signoff: 'Me', theme: 'pine' })).toBe(true)
    expect(await getCardSettings()).toEqual({ message: 'Hi', signoff: 'Me', theme: 'pine' })
    expect(await saveCardSettings({ message: ' ', signoff: 'Me', theme: 'pine' })).toBe(false)
  })
})

describe('recipients', () => {
  it('adds each with its own 7-character code', async () => {
    await addRecipients([
      { name: 'Nan', greeting: 'Hello', message: null },
      { name: 'Tom and Hillary', greeting: null, message: 'Their own words' },
    ])
    const list = await listRecipients()
    expect(list.map((r) => r.name).sort()).toEqual(['Nan', 'Tom and Hillary'])
    expect(new Set(list.map((r) => r.code)).size).toBe(2)
    for (const r of list) expect(r.code).toHaveLength(7)
  })

  it("shows a card with the shared message, or the recipient's own", async () => {
    await addRecipients([
      { name: 'Nan', greeting: 'Hello', message: null },
      { name: 'Sam', greeting: null, message: 'Their own words' },
    ])
    const [nan, sam] = [await find('Nan'), await find('Sam')]
    expect(await cardByCode(nan.code)).toEqual({
      name: 'Nan',
      greeting: 'Hello',
      message: 'Merry Christmas',
      signoff: 'With love, A',
      theme: 'midnight',
    })
    expect((await cardByCode(sam.code))?.message).toBe('Their own words')
  })

  it('answers null for a code no one has, or that is not a code', async () => {
    expect(await cardByCode('abcdefg')).toBeNull()
    expect(await cardByCode('x')).toBeNull()
    expect(await markOpened('abcdefg')).toBe(false)
  })

  it('notes only the first open', async () => {
    await addRecipients([{ name: 'Nan', greeting: null, message: null }])
    const { code } = await find('Nan')
    expect(await markOpened(code)).toBe(true)
    const first = (await find('Nan')).openedAt
    expect(first).toBeInstanceOf(Date)
    await markOpened(code)
    expect((await find('Nan')).openedAt).toEqual(first)
  })

  it('edits the words and keeps the link, and deletes', async () => {
    await addRecipients([{ name: 'Nan', greeting: null, message: null }])
    const before = await find('Nan')
    expect(await updateRecipient(before.id, { name: 'Nana', greeting: 'Hi', message: '' })).toBe(true)
    const after = (await listRecipients())[0]!
    expect(after).toMatchObject({ code: before.code, name: 'Nana', greeting: 'Hi', message: null })
    expect(await updateRecipient(before.id, { name: ' ', greeting: '', message: '' })).toBe(false)
    expect(await deleteRecipient(before.id)).toBe(true)
    expect(await listRecipients()).toEqual([])
  })
})

describe('allowLoginTry', () => {
  it('allows 10 tries an hour for one address, then stops', async () => {
    for (let i = 0; i < 10; i++) expect(await allowLoginTry('someone')).toBe(true)
    expect(await allowLoginTry('someone')).toBe(false)
    expect(await allowLoginTry('another')).toBe(true)
  })
})

async function find(name: string) {
  return (await listRecipients()).find((r) => r.name === name)!
}

describe('open card counts', () => {
  it('counts made and opened cards by design', async () => {
    await countCardEvent('made', 'aussie')
    await countCardEvent('made', 'aussie')
    await countCardEvent('opened', 'aussie')
    await countCardEvent('made', 'beach')
    expect(await cardCounts(['traditional', 'aussie', 'beach'])).toEqual([
      { style: 'traditional', made: 0, opened: 0 },
      { style: 'aussie', made: 2, opened: 1 },
      { style: 'beach', made: 1, opened: 0 },
    ])
    expect(await cardCountsByDay(7)).toEqual([expect.objectContaining({ made: 3, opened: 1 })])
  })
})
