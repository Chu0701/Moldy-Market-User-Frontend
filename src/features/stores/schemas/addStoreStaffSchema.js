import { z } from 'zod'

export const addStoreStaffSchema = z.object({
  email: z.string().trim().pipe(z.email('stores.staff.add.emailInvalid')),
})
