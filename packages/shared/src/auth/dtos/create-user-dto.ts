import { z } from "zod";

export type Gender = "male" | "female" | "other";

export function createUserSchema() {
  return z.object({
    body: z.object({
      email: z
        .string({ message: "Email is required" })
        .email({ message: "Invalid email format" }),
      password: z
        .string({ message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters long" }),
      userName: z
        .string({ message: "User name is required" })
        .min(2, { message: "User name must be at least 2 characters long" }),
      firstName: z
        .string({ message: "First name is required" })
        .min(2, { message: "First name must be at least 2 characters long" })
        .max(50, { message: "First name must be at most 50 characters long" })
        .optional(),
      lastName: z
        .string({ message: "Last name is required" })
        .min(2, { message: "Last name must be at least 2 characters long" })
        .max(50, { message: "Last name must be at most 50 characters long" })
        .optional(),
      age: z
        .number({ message: "Age must be a number" })
        .min(0, { message: "Age must be at least 0" })
        .max(150, { message: "Age must be at most 150" })
        .optional(),
      gender: z.enum(["male", "female", "other"] as Gender[]).optional(),
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
  });
}

export type CreateUserDto = z.infer<
  ReturnType<typeof createUserSchema>
>["body"];
