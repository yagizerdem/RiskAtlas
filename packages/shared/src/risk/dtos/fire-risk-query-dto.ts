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
      // Open-Meteo archive starts in 1940
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "date must be YYYY-MM-DD" })
        .refine((d) => !Number.isNaN(Date.parse(d)), { message: "date is not a valid day" })
        .refine((d) => d >= "1940-01-01" && d <= new Date().toISOString().slice(0, 10), {
          message: "date must be between 1940-01-01 and today",
        })
        .optional(),
    }),
    params: z.object({}).optional(),
  });
}

export type FireRiskQueryDto = z.infer<
  ReturnType<typeof fireRiskQuerySchema>
>["query"];
