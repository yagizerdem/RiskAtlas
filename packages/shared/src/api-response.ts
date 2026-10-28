import { HttpStatusCode } from "./http-status-code.js";

export class ApiResponse<T> {
  constructor(message: string, httpStatusCode: HttpStatusCode, data?: T) {
    this.message = message;
    this.httpStatusCode = httpStatusCode;
    this.data = data;
  }

  public readonly message: string;
  public readonly httpStatusCode: HttpStatusCode;
  public readonly data?: T;

  static from<T>({
    message,
    httpStatusCode,
    data,
  }: {
    message: string;
    httpStatusCode: HttpStatusCode;
    data?: T;
  }): ApiResponse<T> {
    return new ApiResponse(message, httpStatusCode, data);
  }

  static ok<T>(data?: T, message = "OK"): ApiResponse<T> {
    return new ApiResponse(message, HttpStatusCode.OK, data);
  }

  static created<T>(data?: T, message = "Created"): ApiResponse<T> {
    return new ApiResponse(message, HttpStatusCode.CREATED, data);
  }

  static noContent(message = "No Content"): ApiResponse<never> {
    return new ApiResponse(message, HttpStatusCode.NO_CONTENT);
  }

  static error(
    message: string,
    httpStatusCode: HttpStatusCode,
  ): ApiResponse<never> {
    return new ApiResponse(message, httpStatusCode);
  }

  static badRequest(message = "Bad Request"): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.BAD_REQUEST);
  }

  static unauthorized(message = "Unauthorized"): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.UNAUTHORIZED);
  }

  static forbidden(message = "Forbidden"): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.FORBIDDEN);
  }

  static notFound(message = "Not Found"): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.NOT_FOUND);
  }

  static internalServerError(
    message = "Internal Server Error",
  ): ApiResponse<never> {
    return ApiResponse.error(message, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
}
