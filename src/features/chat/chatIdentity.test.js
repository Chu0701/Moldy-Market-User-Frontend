import { expect, test } from 'vitest'
import { getParticipantName, getPeerName } from './chatIdentity'

const room = {
  participant1Id: 'a',
  participant2Id: 'b',
  participant1Name: ' Chu ',
  participant2Name: 'Nguyễn An',
}
test('selects the real peer name for either participant', () => {
  expect(getPeerName(room, 'a')).toBe('Nguyễn An')
  expect(getPeerName(room, 'b')).toBe('Chu')
  expect(getPeerName(room, 'outsider')).toBeNull()
  expect(getPeerName(null, 'a')).toBeNull()
})
test('sender identity never falls back to another participants name or private contact fields', () => {
  expect(getParticipantName(room, 'a')).toBe('Chu')
  expect(getParticipantName(room, 'other')).toBeNull()
  expect(
    getParticipantName({ ...room, participant1Name: ' ', email: 'private@example.test' }, 'a'),
  ).toBeNull()
  expect(getParticipantName({ ...room, participant1Name: {} }, 'a')).toBeNull()
  expect(getParticipantName(undefined, undefined)).toBeNull()
})
