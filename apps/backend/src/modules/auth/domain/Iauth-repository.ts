import { AuthUser } from "@modules/auth/domain/auth-user.js";

export interface IAuthRepository {
  register(record: AuthUser, password: string): Promise<AuthUser>;
  findByEmail(email: string): Promise<AuthUser>;
  findByUid(uid: string): Promise<AuthUser>;
}
