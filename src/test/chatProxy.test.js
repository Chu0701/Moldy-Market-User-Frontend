// @vitest-environment node
import { expect, test } from 'vitest'
import viteConfig from '../../vite.config'

test('SockJS HTTP and WS paths are proxied while chat SPA routes remain navigable', () => {
  const { server } = viteConfig({ mode: 'test' })
  const [pattern, proxy] = Object.entries(server.proxy).find(([key]) => key.startsWith('^/chat/'))
  const match = new RegExp(pattern)
  expect(match.test('/chat/info?t=123')).toBe(true)
  expect(match.test('/chat/123/session/websocket')).toBe(true)
  expect(match.test('/chat/123/session/xhr_send')).toBe(true)
  expect(match.test('/chat')).toBe(false)
  expect(match.test('/chat/ebd6b176-a5ce-4600-81d0-cf4c008f051c')).toBe(false)
  expect(proxy.ws).toBe(true)
})
