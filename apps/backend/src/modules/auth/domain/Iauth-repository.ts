import { AuthUser, NewAuthUser } from "@modules/auth/domain/auth-user.js";

export interface IAuthRepository {
  register(record: NewAuthUser, password: string): Promise<AuthUser>;
  findByEmail(email: string): Promise<AuthUser | null>;
  findByUid(uid: string): Promise<AuthUser | null>;
}
