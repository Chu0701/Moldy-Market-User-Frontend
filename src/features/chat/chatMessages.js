export function getChronologicalMessages(pages = []) {
  const byId = new Map()

  for (const page of pages) {
    for (const message of page.items) {
      if (!byId.has(message.id)) byId.set(message.id, message)
    }
  }

  return [...byId.values()].sort(
    (left, right) =>
      (Date.parse(left.sentAt) || 0) - (Date.parse(right.sentAt) || 0) || left.id - right.id,
  )
}
