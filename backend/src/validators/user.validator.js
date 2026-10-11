import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .optional(),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .optional(),
  role: z
    .enum(['user', 'admin'], { errorMap: () => ({ message: 'Role must be user or admin' }) })
    .optional(),
  isActive: z
    .boolean()
    .optional(),
});
