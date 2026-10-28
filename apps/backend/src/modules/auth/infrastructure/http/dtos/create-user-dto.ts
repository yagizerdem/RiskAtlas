import { z } from "zod";

export type Gender = "male" | "female" | "other";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  userName: z.string().min(2),

  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  age: z.number().min(0).max(150).optional(),
  gender: z.enum(["male", "female", "other"] as Gender[]).optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
