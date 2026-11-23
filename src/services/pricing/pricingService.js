import { apiClient } from '@/services/api/client'
import { unwrap } from '@/services/api/unwrap'

/**
 * @typedef {'NEW'|'SCRATCHED'|'PARTIAL_DAMAGE'|'HEAVILY_DAMAGED'} PricingConditionLevel
 * @typedef {'UNDER_WARRANTY'|'EXPIRED_UNDER_1Y'|'EXPIRED_OVER_1Y'} PricingWarrantyStatus
 * @typedef {{
 *   categoryId: string,
 *   modelId: string,
 *   origin: 'OFFICIAL_VN',
 *   warrantyStatus: PricingWarrantyStatus,
 *   conditionLevel: PricingConditionLevel,
 *   usageMonths: number
 * }} AutoPricingRequest
 * @typedef {{
 *   pricingMode?: string,
 *   status: string,
 *   suggestedPrice?: number | null,
 *   referencePrice?: number | null,
 *   deprecationFactor?: number | null,
 *   conditionFactor?: number | null,
 *   warrantyFactor?: number | null,
 *   referenceModelName?: string | null,
 *   referencePriceUpdatedAt?: string | null,
 *   disclaimer?: string | null,
 *   reason?: string | null
 * }} AutoPricingResult
 */

/**
 * Calculates an auto-suggested resale price (NOTE: Backend path has no /v1 prefix).
 * @param {AutoPricingRequest} payload
 * @returns {Promise<AutoPricingResult>}
 */
export async function calculateAutoPrice(payload) {
  const response = await apiClient.post('/api/pricing/auto', payload)
  return unwrap(response)
}
