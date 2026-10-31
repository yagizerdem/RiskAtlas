import { z } from "zod";
import { required } from "zod/mini";

export function createLoginSchema() {
  return z.object({
    body: z.object({
      email: z
        .string({ message: "Email is required" })
        .email({ message: "Invalid email format" })
        .nonempty({ message: "Email is required" }),
      password: z
        .string({ message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters long" })
        .nonempty({ message: "Password is required" }),
    }),
    query: z.object({}).optional(),
    params: z.object({}).optional(),
  });
}

export type LoginDto = z.infer<ReturnType<typeof createLoginSchema>>["body"];
