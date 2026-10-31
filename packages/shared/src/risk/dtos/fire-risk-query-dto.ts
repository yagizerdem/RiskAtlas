import { z } from "zod";

export function fireRiskQuerySchema() {
  return z.object({
    body: z.object({}).optional(),
    query: z.object({
      lat: z.coerce
        .number({ message: "lat must be a number" })
        .min(-90, { message: "lat must be between -90 and 90" })
        .max(90, { message: "lat must be between -90 and 90" }),
      lon: z.coerce
        .number({ message: "lon must be a number" })
        .min(-180, { message: "lon must be between -180 and 180" })
        .max(180, { message: "lon must be between -180 and 180" }),
    }),
    params: z.object({}).optional(),
  });
}

export type FireRiskQueryDto = z.infer<
  ReturnType<typeof fireRiskQuerySchema>
>["query"];
