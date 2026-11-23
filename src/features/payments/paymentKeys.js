export const paymentKeys = {
  all: (userId) => ['payments', userId],
  mine: (userId) => ['payments', userId, 'mine'],
  detail: (userId, paymentId) => ['payments', userId, 'detail', paymentId],
}
