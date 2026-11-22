export function getParticipantName(conversation, userId) {
  if (!conversation || !userId) return null
  let name
  if (userId === conversation?.participant1Id) name = conversation.participant1Name
  else if (userId === conversation?.participant2Id) name = conversation.participant2Name
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

export function getPeerName(conversation, userId) {
  if (!conversation || !userId) return null
  if (userId === conversation?.participant1Id)
    return getParticipantName(conversation, conversation.participant2Id)
  if (userId === conversation?.participant2Id)
    return getParticipantName(conversation, conversation.participant1Id)
  return null
}

export function getChatBlockReasonKey(reason) {
  if (reason === 'CHAT_STORE_MEMBER') return 'chat.storeMemberBlocked'
  if (reason === 'CHAT_PARTICIPANT_UNAVAILABLE') return 'chat.participantUnavailable'
  return 'chat.sendNotAllowed'
}
