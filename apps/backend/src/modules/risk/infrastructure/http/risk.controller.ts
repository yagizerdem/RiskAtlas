import { TOKENS } from "@core/di/tokens.js";
import { AssessFireRisk } from "@modules/risk/application/assess-fire-risk.js";
import { ApiResponse, HttpStatusCode } from "@riskatlas/shared";
import { Request, Response } from "express";
import { container } from "tsyringe";

export class RiskController {
  constructor() {}

  static async assess(req: Request, res: Response) {
    const assessFireRisk = container.resolve<AssessFireRisk>(
      TOKENS.AssessFireRisk,
    );

    // validateRequest has already checked the ranges
    const assessment = await assessFireRisk.execute({
      lat: Number(req.query.lat),
      lon: Number(req.query.lon),
    });

    return res
      .status(HttpStatusCode.OK)
      .json(ApiResponse.ok(assessment, "Fire risk assessed"));
  }
}
