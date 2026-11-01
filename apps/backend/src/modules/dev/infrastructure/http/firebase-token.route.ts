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

/**
 * @openapi
 * /api/dev/firebase-revoke-id-token:
 *   post:
 *     tags: [Dev]
 *     summary: Issue a new Firebase ID token from the refresh token cookie (development only)
 *     description: |
 *       Reads the `dev_firebase_refresh_token` cookie set by
 *       `/api/dev/firebase-refresh-token`, exchanges it for a new ID token through
 *       the Firebase Secure Token API, and writes both tokens back to cookies.
 *       Only registered when `NODE_ENV=development`.

 *     responses:
 *       200:
 *         description: New ID token issued successfully
 *         headers:
 *           Set-Cookie:
 *             description: Sets `dev_firebase_id_token` and `dev_firebase_refresh_token`
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Revoke id-token successful
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     idToken:
 *                       type: string
 *                       example: eyJhbGciOiJSUzI1NiIsImtpZCI6...
 *                     refreshToken:
 *                       type: string
 *                       example: AMf-vBx...
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Refresh token cookie is missing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Refresh token is missing
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 400
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Firebase rejected the refresh token or could not be reached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Failed to revoke Firebase token
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 500
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 */
firebaseTokenRouter.post(
  "/firebase-revoke-id-token",
  asyncWrapper(FirebaseTokenController.revokeIdToken),
);

/**
 * @openapi
 * /api/dev/firebase-clear-tokens:
 *   post:
 *     tags: [Dev]
 *     summary: Clear Firebase token cookies (development only)
 *     description: |
 *       Removes the `dev_firebase_id_token` and `dev_firebase_refresh_token`
 *       cookies, so subsequent requests from Swagger are sent unauthenticated.
 *       Tokens are not revoked on the Firebase side. Only registered when
 *       `NODE_ENV=development`.
 *
 *     responses:
 *       200:
 *         description: Token cookies cleared successfully
 *         headers:
 *           Set-Cookie:
 *             description: Expires `dev_firebase_id_token` and `dev_firebase_refresh_token`
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cleared Firebase tokens successfully
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   example: {}
 *                 issues:
 *                   type: array
 *                   items:
 *                     type: string
 */
firebaseTokenRouter.post(
  "/firebase-clear-tokens",
  asyncWrapper(FirebaseTokenController.clearTokens),
);

export { firebaseTokenRouter };
