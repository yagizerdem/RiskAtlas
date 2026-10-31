import { Router } from "express";
import { RiskController } from "@modules/risk/infrastructure/http/risk.controller.js";
import { validateRequest } from "@infrastructure/http/middleware/validateRequest.js";
import { fireRiskQuerySchema } from "@riskatlas/shared/risk";
import { asyncWrapper } from "@infrastructure/util/async-wrapper.js";
import { corsMiddleware } from "@infrastructure/security/middleware/cors.middleware.js";

const riskRouter = Router();

// The global security chain is still commented out; open CORS only for this
// read-only router so the web app (another port) can call it.
riskRouter.use(corsMiddleware());

/**
 * @openapi
 * /api/risk:
 *   get:
 *     tags: [Risk]
 *     summary: Structural fire risk and fire weather danger for a point
 *     description: >
 *       structural = how often this land cover (ESA WorldCover) and slope
 *       (Copernicus DEM) burned in Turkey, from EFFIS burnt areas 2022-2025
 *       (1 = Turkish average); level = Turkey land area quintile.
 *       weather = Canadian Fire Weather Index for the day, computed from
 *       Open-Meteo weather, with EFFIS danger classes.
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
 *       - in: query
 *         name: date
 *         required: false
 *         description: Day for the fire weather (YYYY-MM-DD, from 1940 to today). Defaults to today.
 *         schema:
 *           type: string
 *           format: date
 *           example: 2025-06-29
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
 *                     structural:
 *                       type: object
 *                       properties:
 *                         burnRatio:
 *                           type: number
 *                           example: 1.93
 *                         level:
 *                           type: string
 *                           enum: [very_low, low, moderate, high, very_high]
 *                     weather:
 *                       type: object
 *       400:
 *         description: Validation failed
 */
riskRouter.get(
  "/",
  asyncWrapper(validateRequest(fireRiskQuerySchema)),
  asyncWrapper(RiskController.assess),
);

export { riskRouter };
