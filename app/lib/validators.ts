import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Tell us your name'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, '3–20 characters: letters, numbers, underscores'),
  email,
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[0-9]/, 'Include at least one number'),
});

export const forgotSchema = z.object({ email });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotValues = z.infer<typeof forgotSchema>;
