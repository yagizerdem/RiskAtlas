import { AppError } from "@core/errors/app-error.js";
import { ApiResponse, HttpStatusCode } from "@riskatlas/shared";
import { LoginDto } from "@riskatlas/shared/auth";
import { Request, Response } from "express";

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

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
          returnSecureToken: true,
        }),
      },
    );

    if (!response.ok || response.status > 299) {
      throw AppError.internal("Failed to refresh Firebase token");
    }

    const data = await response.json();

    console.log(data);

    res.status(HttpStatusCode.OK).send(
      ApiResponse.ok(
        {
          idToken: null,
        },
        "Refresh token successful",
      ),
    );
  }
}
