import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useChatRead } from './useChatRead'
import { markConversationRead } from '@/services/chat/chatService'
import { meQueryKey } from '@/features/auth/hooks/useSession'
import { chatKeys } from './useChat'
import { clearAccessToken, setAccessToken } from '@/lib/tokenStorage'

vi.mock('@/services/chat/chatService', () => ({ markConversationRead: vi.fn() }))

const room = { id: 'room', participant1Id: 'buyer', participant2Id: 'owner' }
let observers, focused, visibility, client

beforeEach(() => {
  observers = []
  focused = true
  visibility = 'visible'
  vi.spyOn(document, 'hasFocus').mockImplementation(() => focused)
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback) {
        this.callback = callback
        this.observe = vi.fn()
        this.disconnect = vi.fn()
        observers.push(this)
      }
    },
  )
  setAccessToken('read-token')
  vi.mocked(markConversationRead).mockReset().mockResolvedValue(undefined)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(meQueryKey, { id: 'buyer' })
  client.setQueryData(chatKeys.conversations('buyer'), [{ ...room, unreadCount: 2 }])
})
afterEach(() => {
  client.clear()
  clearAccessToken()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function Harness({ messageId = 10, enabled = true, conversation = room }) {
  const { targetRef, hasError, retry } = useChatRead({
    userId: 'buyer',
    conversation,
    messageId,
    enabled,
  })
  return (
    <>
      <div ref={targetRef}>Incoming</div>
      {hasError && <button onClick={retry}>Retry</button>}
    </>
  )
}
function mount(props = {}) {
  const view = render(
    <QueryClientProvider client={client}>
      <Harness {...props} />
    </QueryClientProvider>,
  )
  return {
    ...view,
    update: (next) =>
      view.rerender(
        <QueryClientProvider client={client}>
          <Harness {...next} />
        </QueryClientProvider>,
      ),
  }
}
async function intersect(value = true) {
  await act(async () =>
    observers.at(-1).callback([{ isIntersecting: value, intersectionRatio: value ? 1 : 0 }]),
  )
}

test('requires viewport intersection, document focus and visible tab before acknowledging', async () => {
  focused = false
  mount()
  expect(markConversationRead).not.toHaveBeenCalled()
  await intersect()
  expect(markConversationRead).not.toHaveBeenCalled()
  visibility = 'hidden'
  focused = true
  fireEvent(window, new Event('focus'))
  expect(markConversationRead).not.toHaveBeenCalled()
  visibility = 'visible'
  fireEvent(document, new Event('visibilitychange'))
  await waitFor(() =>
    expect(markConversationRead).toHaveBeenCalledExactlyOnceWith({
      conversationId: 'room',
      messageId: 10,
    }),
  )
})

test('never optimistically clears unread and requires a new intersection for a later message', async () => {
  let finish
  vi.mocked(markConversationRead).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  const view = mount()
  await intersect()
  expect(client.getQueryData(chatKeys.conversations('buyer'))[0].unreadCount).toBe(2)
  view.update({ messageId: 11 })
  await act(async () => finish())
  expect(markConversationRead).toHaveBeenCalledTimes(1)
  await intersect()
  await waitFor(() =>
    expect(markConversationRead).toHaveBeenLastCalledWith({
      conversationId: 'room',
      messageId: 11,
    }),
  )
})

test('serializes a newer visible message behind the in-flight acknowledgement', async () => {
  let finish
  vi.mocked(markConversationRead).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  const view = mount()
  await intersect()
  view.update({ messageId: 11 })
  await intersect()
  expect(markConversationRead).toHaveBeenCalledTimes(1)
  await act(async () => finish())
  await waitFor(() => expect(markConversationRead).toHaveBeenCalledTimes(2))
  expect(markConversationRead).toHaveBeenLastCalledWith({ conversationId: 'room', messageId: 11 })
})

test('keeps failed reads unread and retries only on explicit action', async () => {
  vi.mocked(markConversationRead).mockRejectedValueOnce(new Error('offline'))
  mount()
  await intersect()
  const retry = await screen.findByRole('button', { name: 'Retry' })
  fireEvent(window, new Event('focus'))
  await intersect()
  expect(markConversationRead).toHaveBeenCalledTimes(1)
  expect(client.getQueryData(chatKeys.conversations('buyer'))[0].unreadCount).toBe(2)
  fireEvent.click(retry)
  await waitFor(() => expect(markConversationRead).toHaveBeenCalledTimes(2))
})

test('late completion after logout neither restores nor invalidates private cache', async () => {
  let finish
  vi.mocked(markConversationRead).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  mount()
  await intersect()
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  clearAccessToken()
  client.clear()
  await act(async () => finish())
  expect(invalidate).not.toHaveBeenCalled()
  expect(client.getQueryData(chatKeys.conversations('buyer'))).toBeUndefined()
})

test('does not acknowledge an already read message or a failed history', async () => {
  const view = mount({ conversation: { ...room, lastReadMessageIdParticipant1: 10 } })
  await intersect()
  expect(markConversationRead).not.toHaveBeenCalled()
  view.update({ enabled: false, messageId: 11 })
  expect(markConversationRead).not.toHaveBeenCalled()
})

test('fails closed when viewport observation is unavailable', () => {
  vi.stubGlobal('IntersectionObserver', undefined)
  mount()
  expect(markConversationRead).not.toHaveBeenCalled()
})

test('requires a fresh observation after history disappears and succeeds again', async () => {
  focused = false
  const view = mount()
  await intersect()
  view.update({ enabled: false })
  focused = true
  fireEvent(window, new Event('focus'))
  view.update({ enabled: true })
  expect(markConversationRead).not.toHaveBeenCalled()
  await intersect()
  await waitFor(() => expect(markConversationRead).toHaveBeenCalledTimes(1))
})
