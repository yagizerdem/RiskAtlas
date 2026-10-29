import { Router } from "express";
import { AuthController } from "@modules/auth/infrastructure/http/auth.controller.js";
import { validateRequest } from "@infrastructure/http/middleware/validateRequest.js";
import { createUserSchema } from "@modules/auth/infrastructure/http/dtos/create-user-dto.js";
import { asyncWrapper } from "@infrastructure/util/async-wrapper.js";

const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, userName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: s3cretPass
 *               userName:
 *                 type: string
 *                 minLength: 2
 *                 example: jane_doe
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               age:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 150
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Validation failed
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 400
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Invalid email address"]
 */
authRouter.post(
  "/register",
  asyncWrapper(validateRequest(createUserSchema)),
  asyncWrapper(AuthController.register),
);

export { authRouter };
