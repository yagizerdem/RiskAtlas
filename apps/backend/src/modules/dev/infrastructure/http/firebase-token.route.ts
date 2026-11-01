import { Router } from "express";
import { FirebaseTokenController } from "@modules/dev/infrastructure/http/firebase-token.controller.js";
import { validateRequest } from "@infrastructure/http/middleware/validateRequest.js";
import { createLoginSchema } from "@riskatlas/shared/auth";
import { asyncWrapper } from "@infrastructure/util/async-wrapper.js";

const firebaseTokenRouter = Router();

/**
 * @openapi
 * /api/dev/firebase-refresh-token:
 *   post:
 *     tags: [Dev]
 *     summary: Get a Firebase ID token for Swagger testing (development only)
 *     description: |
 *       Signs in with email and password through the Firebase Auth REST API and
 *       returns an ID token. Paste the token into the **Authorize** dialog to call
 *       protected endpoints. Only registered when `NODE_ENV=development`.
 *       ID tokens expire after 1 hour.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: s3cretPass
 *
 *     responses:
 *       200:
 *         description: Token issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Refresh token successful
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     idToken:
 *                       type: string
 *                       example: eyJhbGciOiJSUzI1NiIsImtpZCI6...
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
 *                   example: ["Invalid email format"]
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 401
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 */
firebaseTokenRouter.post(
  "/firebase-refresh-token",
  asyncWrapper(validateRequest(createLoginSchema)),
  asyncWrapper(FirebaseTokenController.refreshToken),
);

export { firebaseTokenRouter };
