/** Prefer temporary backend media URLs and retain legacy image URLs as a fallback. */
export function getProductMediaUrls(product) {
  const mediaUrls = Array.isArray(product?.media)
    ? product.media.map((item) => item?.viewUrl).filter((url) => typeof url === 'string' && url)
    : []

  if (mediaUrls.length) return mediaUrls
  return Array.isArray(product?.images)
    ? product.images.filter((url) => typeof url === 'string' && url)
    : []
}
