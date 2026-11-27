export function getStoreContext(profile, staffProfile) {
  const roles = profile?.roles ?? []

  if (roles.includes('OWNER')) {
    return { kind: 'owner' }
  }

  if (roles.includes('STAFF')) {
    const permissions = staffProfile?.userId === profile.id ? staffProfile.permissions : []
    const storeId = permissions?.includes('STORE_WORKSPACE_ACCESS')
      ? (staffProfile.storeId ?? null)
      : null

    return {
      kind: 'staff',
      storeId,
      canCreateProduct: Boolean(storeId && permissions?.includes('PRODUCT_CREATE')),
      canManageProducts: Boolean(storeId && permissions?.includes('PRODUCT_MANAGE_OWN')),
      canReadOrders: Boolean(storeId && permissions?.includes('ORDER_PROCESS')),
      canHandleOffers: Boolean(storeId && permissions?.includes('OFFER_HANDLE')),
    }
  }

  return { kind: 'none' }
}
