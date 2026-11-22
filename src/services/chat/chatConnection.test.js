import { afterEach, expect, test, vi } from 'vitest'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { connectChat } from './chatConnection'

vi.mock('@stomp/stompjs', () => ({ Client: vi.fn() }))
vi.mock('sockjs-client/dist/sockjs', () => ({ default: vi.fn() }))
afterEach(() => vi.clearAllMocks())

function setup() {
  const subscriptions = new Map()
  const socket = {
    connected: true,
    activate: vi.fn(),
    deactivate: vi.fn().mockResolvedValue(),
    publish: vi.fn(),
    subscribe: vi.fn((name, handler) => subscriptions.set(name, handler)),
  }
  vi.mocked(Client).mockImplementation(function (options) {
    Object.assign(socket, options)
    return socket
  })
  const callbacks = {
    authorize: vi.fn().mockResolvedValue('access-token'),
    onState: vi.fn(),
    onMessage: vi.fn(),
    onError: vi.fn(),
    onRead: vi.fn(),
  }
  const connection = connectChat(callbacks)
  return { socket, subscriptions, callbacks, connection }
}

test('authenticates through CONNECT headers and subscribes again on every connection', async () => {
  const { socket, callbacks } = setup()
  await socket.beforeConnect()
  expect(socket.connectHeaders).toEqual({ Authorization: 'Bearer access-token' })
  socket.webSocketFactory()
  expect(SockJS).toHaveBeenCalledWith('/chat')
  socket.onConnect()
  socket.onConnect()
  expect(socket.subscribe.mock.calls.map(([name]) => name)).toEqual([
    '/user/queue/messages',
    '/user/queue/errors',
    '/user/queue/chat-reads',
    '/user/queue/messages',
    '/user/queue/errors',
    '/user/queue/chat-reads',
  ])
  expect(callbacks.onState).toHaveBeenLastCalledWith('connected')
})

test('sends only text to the application destination and refuses disconnected sends', () => {
  const { socket, connection } = setup()
  connection.sendText('room-1', 'Xin chào')
  expect(socket.publish).toHaveBeenCalledWith({
    destination: '/app/conversations/room-1/send',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'TEXT', content: 'Xin chào' }),
  })
  socket.connected = false
  expect(() => connection.sendText('room-1', 'Hello')).toThrow()
})

test('validates incoming identity and timestamp, suppresses duplicate ids, handles invalid frames safely', () => {
  const { socket, callbacks, subscriptions } = setup()
  socket.onConnect()
  const message = {
    id: 1,
    conversationId: 'room-1',
    senderId: 'sender',
    type: 'TEXT',
    content: 'Hello',
    sentAt: '2026-11-21T10:00:00Z',
  }
  const receive = subscriptions.get('/user/queue/messages')
  receive({ body: JSON.stringify(message) })
  receive({ body: JSON.stringify(message) })
  expect(callbacks.onMessage).toHaveBeenCalledExactlyOnceWith(message)
  receive({ body: JSON.stringify({ ...message, id: 2, conversationId: null }) })
  expect(callbacks.onMessage).toHaveBeenCalledTimes(1)
  expect(callbacks.onState).toHaveBeenLastCalledWith('failed')
  expect(() => receive({ body: '{broken' })).not.toThrow()
})

test('failed authorization stops the connection without publishing or exposing a token in the URL', async () => {
  const { socket, callbacks } = setup()
  callbacks.authorize.mockRejectedValue({ status: 401 })
  await socket.beforeConnect()
  expect(socket.deactivate).toHaveBeenCalled()
  expect(callbacks.onState).toHaveBeenLastCalledWith('failed')
  expect(socket.publish).not.toHaveBeenCalled()
})

test('cleanup deactivates and ignores late frames', () => {
  const { socket, callbacks, subscriptions, connection } = setup()
  socket.onConnect()
  connection.close()
  subscriptions.get('/user/queue/errors')({ body: '{"code":"COMMON_002"}' })
  expect(socket.deactivate).toHaveBeenCalled()
  expect(callbacks.onError).not.toHaveBeenCalled()
})

test('validates private read receipts and ignores them after cleanup', () => {
  const { socket, callbacks, subscriptions, connection } = setup()
  socket.onConnect()
  const receipt = {
    conversationId: 'room',
    readerId: 'peer',
    messageId: 12,
    readAt: '2026-11-21T10:00:00Z',
  }
  const receive = subscriptions.get('/user/queue/chat-reads')
  receive({ body: JSON.stringify(receipt) })
  expect(callbacks.onRead).toHaveBeenCalledExactlyOnceWith(receipt)
  receive({ body: JSON.stringify({ ...receipt, messageId: -1 }) })
  expect(callbacks.onState).toHaveBeenLastCalledWith('failed')
  connection.close()
  receive({ body: JSON.stringify(receipt) })
  expect(callbacks.onRead).toHaveBeenCalledTimes(1)
})
