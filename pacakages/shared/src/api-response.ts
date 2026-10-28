import { HttpStatusCode } from "./http-status-code.js";
import { MachineCode } from "./machine-code.js";

export class ApiResponse<T> {
  constructor(
    message: string,
    httpStatusCode: HttpStatusCode,
    machineCode?: MachineCode,
    data?: T,
  ) {
    this.message = message;
    this.httpStatusCode = httpStatusCode;
    this.machineCode = machineCode;
    this.data = data;
  }

  public readonly message: string;
  public readonly httpStatusCode: HttpStatusCode;
  public readonly machineCode?: MachineCode;
  public readonly data?: T;

  static from<T>({
    message,
    httpStatusCode,
    machineCode,
    data,
  }: {
    message: string;
    httpStatusCode: HttpStatusCode;
    machineCode?: MachineCode;
    data?: T;
  }): ApiResponse<T> {
    return new ApiResponse(message, httpStatusCode, machineCode, data);
  }

  static ok<T>(data?: T, message = "OK"): ApiResponse<T> {
    return new ApiResponse(message, HttpStatusCode.OK, undefined, data);
  }

  static created<T>(data?: T, message = "Created"): ApiResponse<T> {
    return new ApiResponse(message, HttpStatusCode.CREATED, undefined, data);
  }

  static noContent(message = "No Content"): ApiResponse<never> {
    return new ApiResponse(message, HttpStatusCode.NO_CONTENT);
  }

  static error(
    message: string,
    httpStatusCode: HttpStatusCode,
    machineCode?: MachineCode,
  ): ApiResponse<never> {
    return new ApiResponse(message, httpStatusCode, machineCode);
  }

  static badRequest(
    message = "Bad Request",
    machineCode?: MachineCode,
  ): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.BAD_REQUEST, machineCode);
  }

  static unauthorized(
    message = "Unauthorized",
    machineCode?: MachineCode,
  ): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.UNAUTHORIZED, machineCode);
  }

  static forbidden(
    message = "Forbidden",
    machineCode?: MachineCode,
  ): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.FORBIDDEN, machineCode);
  }

  static notFound(
    message = "Not Found",
    machineCode?: MachineCode,
  ): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.NOT_FOUND, machineCode);
  }

  static internalServerError(
    message = "Internal Server Error",
    machineCode?: MachineCode,
  ): ApiResponse<never> {
    return ApiResponse.error(
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      machineCode,
    );
  }
}
