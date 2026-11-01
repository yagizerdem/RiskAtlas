import { RequestHandler } from "express";
import type { AuthenticatedRequest } from "@infrastructure/security/extended-request-object.js";
import { getAuth } from "firebase-admin/auth";
import firebaseApp from "@infrastructure/firebase/admin-sdk.js";
import type { Request, Response, NextFunction } from "express";
import { DEV_FIREBASE_ID_TOKEN_NAME } from "@modules/dev/public/index.js";
import { FirebaseAppError } from "firebase-admin";

function isOperationalFirebaseAuthError(error: unknown): {
  operational: boolean;
  message: string;
} {
  if (error instanceof FirebaseAppError) {
    switch (error.code) {
      case "auth/id-token-revoked":
        return { operational: true, message: "ID token has been revoked" };
    }
  }

  return { operational: false, message: "Unknown error" };
}

export const firebaseAuthenticationMiddleware = (): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(firebaseApp);

    let idToken: string | undefined;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      idToken = req.headers.authorization.split("Bearer ")[1];
    } else if (process.env.NODE_ENV === "development") {
      idToken = req.cookies[DEV_FIREBASE_ID_TOKEN_NAME];
    }

    try {
      if (idToken) {
        const decodedToken = await auth.verifyIdToken(idToken);
        const authenticatedRequest = req as AuthenticatedRequest;
        if (!authenticatedRequest.auth) {
          authenticatedRequest.auth = {
            subject: decodedToken.uid,
          };
        } else {
          authenticatedRequest.auth.subject = decodedToken.uid;
        }
      }
    } catch (error) {
      if (isOperationalFirebaseAuthError(error)) {
        next();
      }
      return next(error);
    }

    next();
  };
};
