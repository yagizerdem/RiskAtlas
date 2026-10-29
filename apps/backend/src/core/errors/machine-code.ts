import { HttpStatusCode } from "@riskatlas/shared";

// A numeric enum also holds reverse mappings (200 -> "OK"); keep only the names.
const httpCodes = Object.fromEntries(
  Object.entries(HttpStatusCode).filter(([key]) => Number.isNaN(Number(key))),
) as { [K in keyof typeof HttpStatusCode]: (typeof HttpStatusCode)[K] };

export const MachineCode = {
  ...httpCodes,
  // add app-specific codes here, e.g. EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
} as const;

export type MachineCode = (typeof MachineCode)[keyof typeof MachineCode];
