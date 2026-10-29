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
      phoneNumber: z
        .string({ message: "Phone number is optional" })
        .min(10, {
          message: "Phone number must be at least 10 characters long",
        })
        .max(15, { message: "Phone number must be at most 15 characters long" })
        .optional(),
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
  });
}

export type CreateUserDto = z.infer<
  ReturnType<typeof createUserSchema>
>["body"];
