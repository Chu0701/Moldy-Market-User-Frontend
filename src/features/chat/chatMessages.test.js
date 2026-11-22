import { expect, test } from 'vitest'

import { getChronologicalMessages } from './chatMessages'

const oldMessage = { id: 1, sentAt: '2026-11-19T01:00:00Z', content: 'Old message' }
const newMessage = { id: 2, sentAt: '2026-11-19T02:00:00Z', content: 'New message' }

test('shows the newest-first backend page in chronological order without mutating it', () => {
  const items = Object.freeze([Object.freeze(newMessage), Object.freeze(oldMessage)])
  const pages = Object.freeze([Object.freeze({ items })])
  expect(getChronologicalMessages(pages)).toEqual([oldMessage, newMessage])
  expect(items).toEqual([newMessage, oldMessage])
})

test('deduplicates overlapping pages by the server message id and keeps the first copy', () => {
  const pages = [
    { items: [newMessage] },
    { items: [{ ...newMessage, content: 'Older copy' }, oldMessage] },
  ]
  expect(getChronologicalMessages(pages)).toEqual([oldMessage, newMessage])
})

test('uses id ordering for identical timestamps and remains stable with a missing date', () => {
  const laterId = { ...oldMessage, id: 3 }
  const missingDate = { id: 7, sentAt: null }
  expect(getChronologicalMessages([{ items: [laterId, oldMessage, missingDate] }])).toEqual([
    missingDate,
    oldMessage,
    laterId,
  ])
})

test('returns an empty message list for no loaded pages', () => {
  expect(getChronologicalMessages()).toEqual([])
  expect(getChronologicalMessages([{ items: [] }])).toEqual([])
})
