import { Request, Response, NextFunction } from "express";
import { AppError } from "@core/errors/app-error.js";
import { ApiResponse, HttpStatusCode } from "@riskatlas/shared";
import mongoose from "mongoose";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    if (err.isOperational) {
      req.logger.warn("Business error", {
        context: "BusinessError",
        code: err.code,
        message: err.message,
      });
      res.status(err.statusCode).json(
        ApiResponse.from({
          httpStatusCode: err.statusCode,
          message: err.message,
        }),
      );
    } else {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        ApiResponse.from({
          httpStatusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
          message: "Internal server error",
        }),
      );
    }
    return;
  }

  // handle mongo-db errors (mongoose + native driver)
  if (isMongoError(err)) {
    handleMongoDbError(err, req, res);
    return;
  }

  const error =
    err instanceof Error
      ? err
      : new Error(typeof err === "string" ? err : "Unknown error");

  req.logger.error("Unhandled application error", {
    context: "ExpressError",
    method: req.method,
    path: req.originalUrl,
    error: error.message,
    stack: error.stack,
  });

  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
    ApiResponse.from({
      httpStatusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    }),
  );
}

type MongoErrorInfo = {
  status: HttpStatusCode;
  message: string;
  issues?: string[];
};

const { MongoServerError, MongoNetworkError, MongoServerSelectionError } =
  mongoose.mongo;

/**
 * Operational MongoDB server error codes (caused by client input or transient
 * availability), see https://www.mongodb.com/docs/manual/reference/error-codes/
 * Anything not listed (auth failures, namespace/config problems, ...) is a
 * server-side fault and falls through to 500.
 */
const CONFLICT = { status: HttpStatusCode.CONFLICT } as const;
const BAD_REQUEST = { status: HttpStatusCode.BAD_REQUEST } as const;
const UNAVAILABLE = { status: HttpStatusCode.SERVICE_UNAVAILABLE } as const;

const MONGO_SERVER_ERRORS = new Map<number, MongoErrorInfo>([
  // conflicts
  [11000, { ...CONFLICT, message: "Duplicate key error" }], // DuplicateKey
  [11001, { ...CONFLICT, message: "Duplicate key error" }], // legacy DuplicateKey
  [12582, { ...CONFLICT, message: "Duplicate key error" }], // legacy DuplicateKey
  [112, { ...CONFLICT, message: "Write conflict, please retry" }], // WriteConflict

  // invalid input
  [2, { ...BAD_REQUEST, message: "Bad value" }], // BadValue
  [9, { ...BAD_REQUEST, message: "Failed to parse request" }], // FailedToParse
  [14, { ...BAD_REQUEST, message: "Type mismatch" }], // TypeMismatch
  [28, { ...BAD_REQUEST, message: "Invalid field path" }], // PathNotViable
  [40, { ...BAD_REQUEST, message: "Conflicting update operators" }], // ConflictingUpdateOperators
  [52, { ...BAD_REQUEST, message: "Field names must not start with '$'" }], // DollarPrefixedFieldName
  [66, { ...BAD_REQUEST, message: "Immutable field cannot be modified" }], // ImmutableField
  [121, { ...BAD_REQUEST, message: "Document validation failed" }], // DocumentValidationFailure
  [
    10334,
    { status: HttpStatusCode.PAYLOAD_TOO_LARGE, message: "Document too large" },
  ], // BSONObjectTooLarge

  // timeouts
  [
    50,
    {
      status: HttpStatusCode.GATEWAY_TIMEOUT,
      message: "Database operation timed out",
    },
  ], // MaxTimeMSExpired

  // temporary unavailability
  ...[6, 7, 89, 91, 189, 10107, 11600, 11602, 13435, 13436].map(
    (code): [number, MongoErrorInfo] => [
      code,
      { ...UNAVAILABLE, message: "Database temporarily unavailable" },
    ],
  ),
]);

function isMongoError(err: unknown): err is Error {
  return (
    err instanceof mongoose.Error ||
    err instanceof MongoServerError ||
    err instanceof MongoNetworkError ||
    err instanceof MongoServerSelectionError
  );
}

/** Maps an operational Mongo/mongoose error, or undefined if it is not one. */
function resolveMongoError(err: Error): MongoErrorInfo | undefined {
  if (err instanceof MongoServerError) {
    return MONGO_SERVER_ERRORS.get(Number(err.code));
  }

  // connection problems
  if (
    err instanceof MongoNetworkError ||
    err instanceof MongoServerSelectionError
  ) {
    return { ...UNAVAILABLE, message: "Database temporarily unavailable" };
  }

  // mongoose errors
  if (err instanceof mongoose.Error.ValidationError) {
    return {
      ...BAD_REQUEST,
      message: "Validation failed",
      issues: Object.values(err.errors).map((e) => e.message),
    };
  }
  if (err instanceof mongoose.Error.CastError) {
    return { ...BAD_REQUEST, message: `Invalid value for '${err.path}'` };
  }
  if (err instanceof mongoose.Error.DocumentNotFoundError) {
    return { status: HttpStatusCode.NOT_FOUND, message: "Document not found" };
  }
  if (err instanceof mongoose.Error.VersionError) {
    return { ...CONFLICT, message: "Document was modified, please retry" };
  }

  return undefined;
}

function handleMongoDbError(err: Error, req: Request, res: Response) {
  const info = resolveMongoError(err);

  if (info) {
    req.logger.warn("MongoDB operational error", {
      context: "MongoDbError",
      error: err.message,
    });
    res
      .status(info.status)
      .json(
        ApiResponse.error(info.message, info.status, undefined, info.issues),
      );
    return;
  }

  // not operational: fall back to 500
  req.logger.error("MongoDB error", {
    context: "MongoDbError",
    error: err.message,
    stack: err.stack,
  });

  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
    ApiResponse.from({
      httpStatusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    }),
  );
}
