import { ApiResponse, HttpStatusCode } from "@riskatlas/shared";
import { LoginDto } from "@riskatlas/shared/auth";
import { Request, Response } from "express";
import { FirebaseTokenService } from "@modules/dev/infrastructure/firebase/firebase-token.js";
import {
  DEV_FIREBASE_ID_TOKEN_EXPIRATION_TIME_MS,
  DEV_FIREBASE_ID_TOKEN_NAME,
  DEV_FIREBASE_REFRESH_TOKEN_EXPIRATION_TIME_MS,
  DEV_FIREBASE_REFRESH_TOKEN_NAME,
} from "@modules/dev/public/index.js";
import { AppError } from "@core/errors/app-error.js";
import { MachineCode } from "@core/errors/machine-code.js";

export class FirebaseTokenController {
  /*
   * Refresh Firebase token
   * Endpoint :  https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=[API_KEY]
   * This endpoint is used only in dev mode to gain access from protected
   * endpoints from swagger UI without needdin to copy pase token
   * each time from frotnend firebase-sdk generated token
   */

  static async refreshToken(req: Request, res: Response) {
    const body = req.body as LoginDto;

    const data = await FirebaseTokenService.getRefreshToken({
      email: body.email,
      password: body.password,
    });

    res.cookie(DEV_FIREBASE_REFRESH_TOKEN_NAME, data.refreshToken, {
      expires: new Date(
        Date.now() + DEV_FIREBASE_REFRESH_TOKEN_EXPIRATION_TIME_MS,
      ),
    });

    res.cookie(DEV_FIREBASE_ID_TOKEN_NAME, data.idToken, {
      expires: new Date(Date.now() + DEV_FIREBASE_ID_TOKEN_EXPIRATION_TIME_MS),
    });

    res.status(HttpStatusCode.OK).send(
      ApiResponse.ok(
        {
          refreshToken: data.refreshToken,
          idToken: data.idToken,
        },
        "Refresh token successful",
      ),
    );
  }

  /**
   * Revoke Firebase ID token
   * Endpoint :  https://securetoken.googleapis.com/v1/token?key=[API_KEY]
   * This endpoint is used only in dev mode to revoke the Firebase ID token
   * from the client side without needing to go through the frontend firebase-sdk.
   * It sets the Firebase ID token to browser cookies
   */
  static async revokeIdToken(req: Request, res: Response) {
    const refreshToken = req.cookies[DEV_FIREBASE_REFRESH_TOKEN_NAME];
    if (!refreshToken) {
      throw AppError.from({
        message: "Refresh token is missing",
        statusCode: HttpStatusCode.BAD_REQUEST,
        code: MachineCode.DEV_REFRESH_TOKEN_MISSING,
        isOperational: true,
      });
    }
    const data = await FirebaseTokenService.revokeIdToken({
      refreshToken,
    });

    res.cookie(DEV_FIREBASE_REFRESH_TOKEN_NAME, data.refresh_token, {
      expires: new Date(
        Date.now() + DEV_FIREBASE_REFRESH_TOKEN_EXPIRATION_TIME_MS,
      ),
    });

    res.cookie(DEV_FIREBASE_ID_TOKEN_NAME, data.id_token, {
      expires: new Date(Date.now() + DEV_FIREBASE_ID_TOKEN_EXPIRATION_TIME_MS),
    });

    res.status(HttpStatusCode.OK).send(
      ApiResponse.ok(
        {
          refreshToken: data.refresh_token,
          idToken: data.id_token,
        },
        "Revoke id-token successful",
      ),
    );
  }
}
