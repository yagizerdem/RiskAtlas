import { MachineCode } from "@core/errors/machine-code.js";
import { HttpStatusCode } from "@riskatlas/shared";

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: MachineCode | undefined;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    code?: MachineCode | undefined,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
