export const wishlistKeys = {
  all: (userId) => ['wishlist', userId],
  list: (userId, page = 1, size = 20) => ['wishlist', userId, 'list', { page, size }],
  check: (userId, productId) => ['wishlist', userId, 'check', productId],
  count: (userId) => ['wishlist', userId, 'count'],
  productCount: (productId) => ['wishlist', 'productCount', productId],
}
