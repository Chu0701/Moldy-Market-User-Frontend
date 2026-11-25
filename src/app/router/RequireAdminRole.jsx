import { RequireRole } from '@/app/router/RequireRole'

export function RequireAdminRole() {
  return <RequireRole role="ADMIN" />
}
