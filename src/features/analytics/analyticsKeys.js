export const analyticsKeys = {
  sellerOverview: (userId) => ['analytics', userId, 'seller', 'overview'],
  sellerRevenue: (userId, from, to) => ['analytics', userId, 'seller', 'revenue', { from, to }],
  sellerTopProducts: (userId, limit) => ['analytics', userId, 'seller', 'top-products', { limit }],
  priceHistory: (userId, productId) => ['analytics', userId, 'buyer', 'price-history', productId],
}
