import { AppError } from "@core/errors/app-error.js";
import { MachineCode } from "@core/errors/machine-code.js";
import { HttpStatusCode } from "@riskatlas/shared";

export class UserAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(
      `User with email ${email} already exists`,
      HttpStatusCode.CONFLICT,
      true,
      MachineCode.CONFLICT,
    );
  }
}
