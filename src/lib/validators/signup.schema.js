import { z } from "zod";

export const signupSchema = z
  .object({
    firstName: z.string().min(2, "First name is too short."),
    lastName: z
      .string()
      .min(2, "Last name is too short.")
      .optional()
      .or(z.literal("")),
    email: z.email({ message: "Invalid email address." }),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
