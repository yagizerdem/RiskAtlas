import rateLimit, { Options } from "express-rate-limit";
import { RequestHandler } from "express";

export const rateLimitMiddleware = (
  rateLimitOptions?: Options,
): RequestHandler => {
  if (rateLimitOptions) {
    return rateLimit(rateLimitOptions);
  }

  return rateLimit(defaultRateLimitOptions);
};

const defaultRateLimitOptions: Partial<Options> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  validate: {
    trustProxy: false,
  },
};
