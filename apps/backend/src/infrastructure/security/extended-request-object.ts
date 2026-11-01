import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  auth?: {
    subject?: string;
    [key: string]: unknown;
  };
}
