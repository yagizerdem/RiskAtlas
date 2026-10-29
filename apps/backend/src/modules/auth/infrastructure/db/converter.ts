import type { UserRecord } from "firebase-admin/auth";
import type { AuthUser } from "@modules/auth/domain/auth-user.js";

export function toAuthUser(userRecord: UserRecord): AuthUser {
  return {
    uid: userRecord.uid,
    email: userRecord.email!,
    emailVerified: userRecord.emailVerified,
    displayName: userRecord.displayName!,
    phoneNumber: userRecord.phoneNumber ?? undefined,
    photoURL: userRecord.photoURL ?? undefined,
  };
}

export function toUserRecord(authUser: AuthUser): UserRecord {
  return {
    uid: authUser.uid,
    email: authUser.email,
    emailVerified: authUser.emailVerified,
    displayName: authUser.displayName,
    phoneNumber: authUser.phoneNumber,
    photoURL: authUser.photoURL,
  } as UserRecord;
}
