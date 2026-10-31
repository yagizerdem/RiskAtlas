import { Router } from "express";
import { RiskController } from "@modules/risk/infrastructure/http/risk.controller.js";
import { validateRequest } from "@infrastructure/http/middleware/validateRequest.js";
import { fireRiskQuerySchema } from "@riskatlas/shared/risk";
import { asyncWrapper } from "@infrastructure/util/async-wrapper.js";

const riskRouter = Router();

/**
 * @openapi
 * /api/risk:
 *   get:
 *     tags: [Risk]
 *     summary: Fire hazard score for a point (weather × fuel × slope)
 *     description: >
 *       Combines OpenWeather Fire Weather Index (weather), ESA WorldCover
 *       land cover (fuel) and Copernicus DEM slope. When FWI is unavailable
 *       the score is computed from fuel and slope only (mode = static).
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           example: 38.42
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           example: 27.13
 *     responses:
 *       200:
 *         description: Fire risk assessed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Fire risk assessed
 *                 httpStatusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: number
 *                       example: 42.5
 *                     level:
 *                       type: string
 *                       enum: [very_low, low, moderate, high, very_high]
 *                     mode:
 *                       type: string
 *                       enum: [dynamic, static]
 *                     components:
 *                       type: object
 *                     formula:
 *                       type: string
 *       400:
 *         description: Validation failed
 */
riskRouter.get(
  "/",
  asyncWrapper(validateRequest(fireRiskQuerySchema)),
  asyncWrapper(RiskController.assess),
);

export { riskRouter };
