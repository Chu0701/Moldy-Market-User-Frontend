import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { meQueryKey } from '@/features/auth/hooks/useSession'
import { chatKeys } from './useChat'
import { getAccessToken } from '@/lib/tokenStorage'
import { startConversation } from '@/services/chat/chatService'

export function useStartStoreChat(userId) {
  const client = useQueryClient()
  const mounted = useRef(false)
  const locked = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const isCurrent = (actorId) =>
    mounted.current &&
    getAccessToken() &&
    !client.getQueryState(meQueryKey)?.error &&
    client.getQueryData(meQueryKey)?.id === actorId
  const mutation = useMutation({
    retry: false,
    mutationFn: async ({ actorId, ownerId }) => {
      if (!actorId || !ownerId || actorId === ownerId || !isCurrent(actorId)) return null
      const room = await startConversation({ targetUserId: ownerId })
      if (!isCurrent(actorId)) return null
      const participants = [room?.participant1Id, room?.participant2Id]
      if (
        typeof room?.id !== 'string' ||
        !room.id ||
        !participants.includes(actorId) ||
        !participants.includes(ownerId) ||
        !['ACTIVE', 'CLOSED'].includes(room.status)
      )
        throw new Error('Invalid conversation response')
      const key = chatKeys.conversations(actorId)
      client.setQueryData(key, (previous = []) =>
        previous.some((item) => item.id === room.id)
          ? previous.map((item) => (item.id === room.id ? room : item))
          : [room, ...previous],
      )
      void client.invalidateQueries({ queryKey: key, exact: true, refetchType: 'none' })
      return room
    },
  })

  async function open(ownerId) {
    if (locked.current) return null
    locked.current = true
    try {
      return await mutation.mutateAsync({ actorId: userId, ownerId })
    } catch {
      // The component displays mutation.error; never retry the POST automatically.
      return null
    } finally {
      locked.current = false
    }
  }
  return { isPending: mutation.isPending, error: mutation.error, open }
}
