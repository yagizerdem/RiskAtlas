import { AppError } from "@core/errors/app-error.js";

export interface FirebaseRefreshTokenResponse {
  idToken: string; // A Firebase Auth ID token for the newly created user.
  email: string; // The email for the newly created user.
  refreshToken: string; // A Firebase Auth refresh token for the newly created user.
  expiresIn: string; // The number of seconds in which the ID token expires.
  localId: string; // The uid of the newly created user.
}

interface FirebaseRevokeTokenResponse {
  expires_in: string; // The number of seconds in which the ID token expires.
  token_type: string; // The type of the refresh token, always "Bearer".
  refresh_token: string; // The Firebase Auth refresh token provided in the request or a new refresh token.
  id_token: string; // A Firebase Auth ID token.
  user_id: string; // The uid corresponding to the provided ID token.
  project_id: string; // Your Firebase project ID.
}

export class FirebaseTokenService {
  public static async getRefreshToken({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<FirebaseRefreshTokenResponse> {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true,
        }),
      },
    );

    if (!response.ok || response.status > 299) {
      throw AppError.internal("Failed to refresh Firebase token");
    }

    const data = await response.json();

    return data as FirebaseRefreshTokenResponse;
  }

  public static async revokeIdToken({
    refreshToken,
  }: {
    refreshToken: string;
  }) {
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      },
    );

    if (!response.ok || response.status > 299) {
      throw AppError.internal("Failed to revoke Firebase token");
    }

    const data = await response.json();

    return data as FirebaseRevokeTokenResponse;
  }
}
