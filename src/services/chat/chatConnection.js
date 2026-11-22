import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'
import { apiClient } from '@/services/api/client'

function readMessage(body) {
  const message = JSON.parse(body)
  if (
    !Number.isSafeInteger(message?.id) ||
    message.id < 1 ||
    typeof message.conversationId !== 'string' ||
    !message.conversationId ||
    typeof message.senderId !== 'string' ||
    !message.senderId ||
    !['TEXT', 'IMAGE', 'FILE'].includes(message.type) ||
    !Number.isFinite(Date.parse(message.sentAt)) ||
    (message.type === 'TEXT' && typeof message.content !== 'string')
  ) {
    throw new Error('Invalid chat message')
  }
  return message
}

/** Connects the current account to the existing STOMP/SockJS endpoint. */
export function connectChat({ authorize, onState, onMessage, onError, onRead }) {
  let disposed = false
  let failed = false
  const seen = new Set()
  const endpoint = `${(apiClient.defaults.baseURL || '').replace(/\/$/, '')}/chat`
  const stop = () => void client.deactivate({ force: true }).catch(() => undefined)
  function fail() {
    if (disposed) return
    failed = true
    onState('failed')
    stop()
  }
  const client = new Client({
    webSocketFactory: () => new SockJS(endpoint),
    reconnectDelay: 5000,
    connectionTimeout: 8000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    beforeConnect: async () => {
      if (disposed) return
      failed = false
      onState('connecting')
      try {
        const token = await authorize()
        if (disposed) return
        if (!token) throw new Error('Missing access token')
        client.connectHeaders = { Authorization: `Bearer ${token}` }
      } catch {
        fail()
      }
    },
    onConnect: () => {
      if (disposed) return
      client.subscribe('/user/queue/messages', (frame) => {
        if (disposed || failed) return
        try {
          const message = readMessage(frame.body)
          if (seen.has(message.id)) return
          seen.add(message.id)
          if (seen.size > 200) seen.delete(seen.values().next().value)
          onMessage(message)
        } catch {
          fail()
        }
      })
      client.subscribe('/user/queue/errors', (frame) => {
        if (disposed || failed) return
        try {
          const error = JSON.parse(frame.body)
          if (typeof error?.code !== 'string') throw new Error('Invalid chat error')
          onError(error)
        } catch {
          fail()
        }
      })
      client.subscribe('/user/queue/chat-reads', (frame) => {
        if (disposed || failed) return
        try {
          const receipt = JSON.parse(frame.body)
          if (
            !receipt?.conversationId ||
            typeof receipt.conversationId !== 'string' ||
            !receipt.readerId ||
            typeof receipt.readerId !== 'string' ||
            !Number.isSafeInteger(receipt.messageId) ||
            receipt.messageId < 1 ||
            !Number.isFinite(Date.parse(receipt.readAt))
          )
            throw new Error('Invalid read receipt')
          onRead?.(receipt)
        } catch {
          fail()
        }
      })
      onState('connected')
    },
    onStompError: fail,
    onWebSocketClose: () => {
      if (!disposed) onState(failed ? 'failed' : 'disconnected')
    },
  })
  client.activate()
  return {
    sendText(conversationId, content) {
      if (disposed || !client.connected) throw new Error('Chat is disconnected')
      client.publish({
        destination: `/app/conversations/${encodeURIComponent(conversationId)}/send`,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'TEXT', content }),
      })
    },
    close() {
      disposed = true
      stop()
    },
  }
}
