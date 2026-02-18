import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  username: z.string().min(2).max(100),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export type RegisterData = z.infer<typeof registerSchema>
export type LoginData = z.infer<typeof loginSchema>

export const verifyEmailSchema = z.object({
  token: z.string(),
})

export const resendVerificationSchema = z.object({
  email: z.string().email(),
})
