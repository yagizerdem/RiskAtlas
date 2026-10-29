import { AppError } from "@core/errors/app-error.js";
import { MachineCode } from "@core/errors/machine-code.js";
import { ApiResponse, HttpStatusCode } from "@riskatlas/shared";
import { Request, Response } from "express";

export class AuthController {
  constructor() {}

  static async register(req: Request, res: Response) {
    throw AppError.from({
      message: "register user not implemented",
      statusCode: HttpStatusCode.NOT_IMPLEMENTED,
      code: MachineCode.NOT_IMPLEMENTED,
      isOperational: true,
    });

    return res
      .status(HttpStatusCode.OK)
      .json(ApiResponse.ok({}, "User registered successfully"));
  }
}
