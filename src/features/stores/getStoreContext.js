export function getStoreContext(profile) {
  const roles = profile?.roles ?? []

  if (roles.includes('OWNER')) {
    return { kind: 'owner' }
  }

  if (roles.includes('STAFF')) {
    const storeId = profile.permissions?.includes('STORE_WORKSPACE_ACCESS')
      ? (profile.storeId ?? null)
      : null

    return {
      kind: 'staff',
      storeId,
      canCreateProduct: Boolean(storeId && profile.permissions?.includes('PRODUCT_CREATE')),
    }
  }

  return { kind: 'none' }
}
