import { ApiResponse, HttpStatusCode } from "@riskatlas/shared";
import { Request, Response } from "express";

export class AuthController {
  constructor() {}

  static async register(req: Request, res: Response) {
    return res
      .status(HttpStatusCode.OK)
      .json(ApiResponse.ok({}, "User registered successfully"));
  }
}
