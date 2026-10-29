import { IAuthRepository } from "@modules/auth/domain/Iauth-repository.js";
import { FirebaseAuthError, getAuth } from "firebase-admin/auth";
import app from "@infrastructure/firebase/admin-sdk.js";
import { AuthUser } from "@modules/auth/domain/auth-user.js";
import { toAuthUser } from "./converter.js";

export class FirebaseAuthRepository implements IAuthRepository {
  async register(record: AuthUser, password: string): Promise<AuthUser> {
    try {
      const userRecordFromDb = await getAuth(app).createUser({
        disabled: false,
        email: record.email,
        emailVerified: record.emailVerified,
        displayName: record.displayName,
        phoneNumber: record.phoneNumber,
        photoURL: record.photoURL,
        password: password,
      });

      return toAuthUser(userRecordFromDb);
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    try {
      const userRecord = await getAuth(app).getUserByEmail(email);
      return toAuthUser(userRecord);
    } catch (error) {
      if (
        error instanceof FirebaseAuthError &&
        error.code === "auth/user-not-found"
      ) {
        return null;
      }
      throw error;
    }
  }

  async findByUid(uid: string): Promise<AuthUser | null> {
    try {
      const userRecord = await getAuth(app).getUser(uid);
      return toAuthUser(userRecord);
    } catch (error) {
      if (
        error instanceof FirebaseAuthError &&
        error.code === "auth/user-not-found"
      ) {
        return null;
      }
      throw error;
    }
  }
}
