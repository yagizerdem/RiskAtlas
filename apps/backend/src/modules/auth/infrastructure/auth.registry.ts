import { registry } from "tsyringe";
import { TOKENS } from "@core/di/tokens.js";
import { FirebaseRegisterUser } from "@modules/auth/application/firebase-register-user.js";

import { FirebaseAuthRepository } from "@modules/auth/infrastructure/db/firebase-auth-repository.js";

@registry([
  {
    token: TOKENS.AuthRepository,
    useClass: FirebaseAuthRepository,
  },
  {
    token: TOKENS.RegisterUser,
    useClass: FirebaseRegisterUser,
  },
])
export class UserRegistry {}
