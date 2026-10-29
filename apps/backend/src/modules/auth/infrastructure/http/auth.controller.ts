import { TOKENS } from "@core/di/tokens.js";
import { AppError } from "@core/errors/app-error.js";
import { MachineCode } from "@core/errors/machine-code.js";
import app from "@infrastructure/firebase/admin-sdk.js";
import { FirebaseRegisterUser } from "@modules/auth/application/firebase-register-user.js";
import { ApiResponse, HttpStatusCode } from "@riskatlas/shared";
import { CreateUserDto } from "@riskatlas/shared/auth";
import { Request, Response } from "express";
import { getAuth, UserRecord } from "firebase-admin/auth";
import { randomBytes } from "node:crypto";
import { container } from "tsyringe";

export class AuthController {
  constructor() {}

  static async register(req: Request, res: Response) {
    const registerUser = container.resolve<FirebaseRegisterUser>(
      TOKENS.RegisterUser,
    );

    const data = req.body as CreateUserDto;
    const appUser = await registerUser.execute(
      {
        displayName: data.userName,
        email: data.email,
        emailVerified: false,
        uid: randomBytes(16).toString("hex"),
      },
      data.password,
    );

    return res
      .status(HttpStatusCode.OK)
      .json(ApiResponse.ok(appUser, "User registered successfully"));
  }
}
