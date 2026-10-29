import { inject, injectable } from "tsyringe";
import { IAuthRepository } from "@modules/auth/domain/Iauth-repository.js";
import { TOKENS } from "@core/di/tokens.js";
// import { EventBus } from "@/core/events/event-bus.js";
import { UserAlreadyExistsError } from "@modules/auth/domain/errors/user-already-exist.js";
import { AuthUser, NewAuthUser } from "@modules/auth/domain/auth-user.js";

@injectable()
export class FirebaseRegisterUser {
  constructor(
    @inject(TOKENS.AuthRepository) private authRepository: IAuthRepository,
    // @inject(TOKENS.EventBus) private eventBus: EventBus,
  ) {}

  async execute(authUser: NewAuthUser, password: string): Promise<AuthUser> {
    const existingUser = await this.authRepository.findByEmail(authUser.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(authUser.email);
    }

    // this.eventBus.emitEvent({
    //   type: "user.created",
    //   payload: {
    //     userId: savedUser.id,
    //     email: savedUser.email,
    //   },
    // });

    // return savedUser;

    const userRecordFromDb = await this.authRepository.register(
      authUser,
      password,
    );

    return userRecordFromDb;
  }
}
