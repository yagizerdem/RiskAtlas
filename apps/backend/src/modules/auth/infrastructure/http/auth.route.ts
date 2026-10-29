import { Router } from "express";
import { AuthController } from "@modules/auth/infrastructure/http/auth-controller.js";
import { validateRequest } from "@infrastructure/http/middleware/validateRequest.js";
import { createUserSchema } from "@modules/auth/infrastructure/http/dtos/create-user-dto.js";

const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest(createUserSchema),
  AuthController.register,
);

export { authRouter };
