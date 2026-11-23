export const disputeKeys = {
  all: (userId) => ['disputes', userId],
  list: (userId) => ['disputes', userId, 'list'],
  byOrder: (userId, orderId) => ['disputes', userId, 'order', orderId],
}
