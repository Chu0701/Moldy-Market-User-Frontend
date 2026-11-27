import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth/hooks/useSession'
import { offerKeys } from '@/features/offers/offerKeys'
import { chatKeys } from './useChat'
import { getAccessToken, subscribeToAccessToken } from '@/lib/tokenStorage'
import { connectChat } from '@/services/chat/chatConnection'

const sendError = (key) => Object.assign(new Error(key), { translationKey: key })

export function useChatRealtime(userId, enabled) {
  const client = useQueryClient()
  const token = useSyncExternalStore(subscribeToAccessToken, getAccessToken, () => null)
  const connection = useRef(null)
  const pending = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [isPending, setIsPending] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled || !userId || !token) return
    let disposed = false
    const isCurrent = () =>
      !disposed && getAccessToken() === token && client.getQueryData(meQueryKey)?.id === userId
    function finish(error) {
      const outgoing = pending.current
      if (!outgoing) return
      pending.current = null
      clearTimeout(outgoing.timer)
      if (isCurrent()) setIsPending(false)
      if (error) outgoing.reject(error)
      else outgoing.resolve()
    }
    const transport = connectChat({
      authorize: async () => {
        // A REST session check uses the existing refresh-once interceptor before CONNECT.
        await client.refetchQueries({ queryKey: meQueryKey, exact: true }, { throwOnError: true })
        if (!isCurrent()) throw new Error('Session changed')
        return token
      },
      onState: (next) => {
        if (!isCurrent()) return
        setStatus(next)
        if (next !== 'connected') finish(sendError('chat.sendUncertain'))
        if (!pending.current) setIsPending(false)
        if (next === 'connected') void client.invalidateQueries({ queryKey: ['chat', userId] })
      },
      onMessage: async (message) => {
        if (!isCurrent()) return
        const rooms = client.getQueryData(chatKeys.conversations(userId)) ?? []
        const room = rooms.find((item) => item.id === message.conversationId)
        const participants = room ? [room.participant1Id, room.participant2Id] : []
        if (!participants.includes(userId) || !participants.includes(message.senderId)) {
          void client.invalidateQueries({ queryKey: chatKeys.conversations(userId), exact: true })
          return
        }
        const outgoing = pending.current
        const matchesText =
          outgoing?.type === 'TEXT' &&
          message.type === 'TEXT' &&
          message.content === outgoing.content
        const matchesImage =
          outgoing?.type === 'IMAGE' &&
          message.type === 'IMAGE' &&
          message.attachmentUrl === outgoing.attachmentUrl
        if (
          outgoing &&
          outgoing.conversationId === message.conversationId &&
          message.senderId === userId &&
          (matchesText || matchesImage)
        )
          finish()
        const key = chatKeys.messages(userId, message.conversationId)
        await client.cancelQueries({ queryKey: key, exact: true })
        if (!isCurrent()) return
        void client.invalidateQueries({ queryKey: key, exact: true })
        void client.invalidateQueries({ queryKey: chatKeys.conversations(userId), exact: true })
        if (message.offerId) {
          void client.invalidateQueries({ queryKey: offerKeys.all(userId) })
        }
      },
      onError: (error) => {
        if (!isCurrent()) return
        const rejected = [
          'CHAT_001',
          'CHAT_002',
          'CHAT_004',
          'CHAT_005',
          'CHAT_006',
          'COMMON_002',
        ].includes(error.code)
        finish(sendError(rejected ? 'chat.sendRejected' : 'chat.sendUncertain'))
        void client.invalidateQueries({ queryKey: ['chat', userId] })
      },
      onRead: () => {
        if (!isCurrent()) return
        // Read metadata comes from REST, including missed/out-of-order receipts.
        void client.invalidateQueries({ queryKey: chatKeys.conversations(userId), exact: true })
      },
    })
    connection.current = { transport, token, userId, finish }
    return () => {
      disposed = true
      transport.close()
      finish(sendError('chat.sendUncertain'))
      if (connection.current?.transport === transport) connection.current = null
    }
  }, [client, userId, token, enabled, attempt])

  function sendText(conversationId, content) {
    const active = connection.current
    const room = client
      .getQueryData(chatKeys.conversations(userId))
      ?.find((item) => item.id === conversationId)
    if (
      !active ||
      active.token !== getAccessToken() ||
      active.userId !== client.getQueryData(meQueryKey)?.id ||
      pending.current ||
      !content.trim() ||
      room?.status !== 'ACTIVE' ||
      room.canSend !== true ||
      ![room.participant1Id, room.participant2Id].includes(userId)
    ) {
      return Promise.reject(sendError('chat.sendUnavailable'))
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => active.finish(sendError('chat.sendUncertain')), 15000)
      pending.current = { type: 'TEXT', conversationId, content, resolve, reject, timer }
      setIsPending(true)
      try {
        active.transport.sendText(conversationId, content)
      } catch {
        active.finish(sendError('chat.sendUnavailable'))
      }
    })
  }

  function sendImage(conversationId, attachmentUrl) {
    const active = connection.current
    const room = client
      .getQueryData(chatKeys.conversations(userId))
      ?.find((item) => item.id === conversationId)
    if (
      !active ||
      active.token !== getAccessToken() ||
      active.userId !== client.getQueryData(meQueryKey)?.id ||
      pending.current ||
      !attachmentUrl ||
      room?.status !== 'ACTIVE' ||
      room.canSend !== true ||
      ![room.participant1Id, room.participant2Id].includes(userId)
    ) {
      return Promise.reject(sendError('chat.sendUnavailable'))
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => active.finish(sendError('chat.sendUncertain')), 15000)
      pending.current = { type: 'IMAGE', conversationId, attachmentUrl, resolve, reject, timer }
      setIsPending(true)
      try {
        active.transport.sendImage(conversationId, attachmentUrl)
      } catch {
        active.finish(sendError('chat.sendUnavailable'))
      }
    })
  }

  return {
    status: enabled && token ? status : 'idle',
    isPending,
    sendText,
    sendImage,
    reconnect: () => setAttempt((value) => value + 1),
  }
}
