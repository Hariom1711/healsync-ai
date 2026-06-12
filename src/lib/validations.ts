import * as z from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['PATIENT', 'DOCTOR']),
  specialty: z.string().optional(),
}).refine((data) => {
  if (data.role === 'DOCTOR' && (!data.specialty || data.specialty.trim() === '')) {
    return false
  }
  return true
}, {
  message: 'Specialty is required for doctor accounts',
  path: ['specialty'],
})

export const LoginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
