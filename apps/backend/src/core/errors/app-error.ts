import { MachineCode } from "@core/errors/machine-code.js";
import { HttpStatusCode } from "@riskatlas/shared";

export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: MachineCode | undefined;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    code?: MachineCode | undefined,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }

  static from({
    message,
    statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    isOperational = true,
    code,
  }: {
    message: string;
    statusCode?: HttpStatusCode;
    isOperational?: boolean;
    code?: MachineCode | undefined;
  }) {
    return new AppError(message, statusCode, isOperational, code);
  }

  static badRequest(message = "Bad request"): AppError {
    return new AppError(
      message,
      HttpStatusCode.BAD_REQUEST,
      true,
      MachineCode.BAD_REQUEST,
    );
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(
      message,
      HttpStatusCode.UNAUTHORIZED,
      true,
      MachineCode.UNAUTHORIZED,
    );
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(
      message,
      HttpStatusCode.FORBIDDEN,
      true,
      MachineCode.FORBIDDEN,
    );
  }

  static notFound(message = "Not found"): AppError {
    return new AppError(
      message,
      HttpStatusCode.NOT_FOUND,
      true,
      MachineCode.NOT_FOUND,
    );
  }

  static conflict(message = "Conflict"): AppError {
    return new AppError(
      message,
      HttpStatusCode.CONFLICT,
      true,
      MachineCode.CONFLICT,
    );
  }

  static tooManyRequests(message = "Too many requests"): AppError {
    return new AppError(
      message,
      HttpStatusCode.TOO_MANY_REQUESTS,
      true,
      MachineCode.TOO_MANY_REQUESTS,
    );
  }

  static serviceUnavailable(message = "Service unavailable"): AppError {
    return new AppError(
      message,
      HttpStatusCode.SERVICE_UNAVAILABLE,
      true,
      MachineCode.SERVICE_UNAVAILABLE,
    );
  }

  /** Non-operational: unexpected failure, not safe to expose details. */
  static internal(message = "Internal server error"): AppError {
    return new AppError(
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      false,
      MachineCode.INTERNAL_SERVER_ERROR,
    );
  }
}
