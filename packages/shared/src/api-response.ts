import HttpStatusCode from "./http-status-code.js";

export class ApiResponse<T> {
  constructor(
    message: string,
    httpStatusCode: HttpStatusCode,
    data?: T,
    issues?: string[],
  ) {
    this.message = message;
    this.httpStatusCode = httpStatusCode;
    this.data = data;
    this.issues = issues ?? [];
  }

  public readonly message: string;
  public readonly httpStatusCode: HttpStatusCode;
  public readonly data?: T;
  public readonly issues: string[] = [];

  static from<T>({
    message,
    httpStatusCode,
    data,
  }: {
    message: string;
    httpStatusCode: HttpStatusCode;
    data?: T;
  }): ApiResponse<T> {
    return new ApiResponse(message, httpStatusCode, data, []);
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

  static error<T>(
    message: string,
    httpStatusCode: HttpStatusCode,
    data?: T,
    issues?: string[],
  ): ApiResponse<T> {
    return new ApiResponse(message, httpStatusCode, data, issues);
  }

  static badRequest(
    message = "Bad Request",
    issues?: string[],
  ): ApiResponse<never> {
    return ApiResponse.error<never>(
      message,
      HttpStatusCode.BAD_REQUEST,
      undefined,
      issues,
    );
  }

  static unauthorized(
    message = "Unauthorized",
    issues?: string[],
  ): ApiResponse<never> {
    return ApiResponse.error<never>(
      message,
      HttpStatusCode.UNAUTHORIZED,
      undefined,
      issues,
    );
  }

  static forbidden(
    message = "Forbidden",
    issues?: string[],
  ): ApiResponse<never> {
    return ApiResponse.error<never>(
      message,
      HttpStatusCode.FORBIDDEN,
      undefined,
      issues,
    );
  }

  static notFound(
    message = "Not Found",
    issues?: string[],
  ): ApiResponse<never> {
    return ApiResponse.error<never>(
      message,
      HttpStatusCode.NOT_FOUND,
      undefined,
      issues,
    );
  }

  static internalServerError(
    message = "Internal Server Error",
    issues?: string[],
  ): ApiResponse<never> {
    return ApiResponse.error<never>(
      message,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      undefined,
      issues,
    );
  }
}
