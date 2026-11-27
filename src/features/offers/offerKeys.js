export const offerKeys = {
  all: (userId) => ['offers', userId],
  sent: (userId, page, size) => ['offers', userId, 'sent', page, size],
  received: (userId, page, size) => ['offers', userId, 'received', page, size],
  activeForProduct: (userId, productId) => ['offers', userId, 'product-active', productId],
  detail: (userId, offerId) => ['offers', userId, 'detail', offerId],
  history: (userId, offerId, page, size) => ['offers', userId, 'history', offerId, page, size],
}
