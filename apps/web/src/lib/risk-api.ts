const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type RiskLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

export type FireRiskAssessment = {
  location: { lat: number; lon: number };
  score: number;
  level: RiskLevel;
  mode: "dynamic" | "static";
  components: {
    weather:
      | { available: true; fwi: number; dangerLabel: string; factor: number }
      | { available: false; reason: string };
    fuel: { worldCoverClass: number; label: string; flammability: number };
    terrain: { elevationM: number | null; slopeDeg: number; slopeFactor: number };
  };
  formula: string;
};

export const LEVEL_STYLE: Record<RiskLevel, { label: string; color: string }> = {
  very_low: { label: "Çok düşük", color: "#16a34a" },
  low: { label: "Düşük", color: "#84cc16" },
  moderate: { label: "Orta", color: "#eab308" },
  high: { label: "Yüksek", color: "#f97316" },
  very_high: { label: "Çok yüksek", color: "#dc2626" },
};

export async function fetchFireRisk(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<FireRiskAssessment> {
  const res = await fetch(`${API_URL}/api/risk?lat=${lat}&lon=${lon}`, {
    signal,
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.issues?.join(", ") || body?.message || res.statusText);
  }
  return body.data as FireRiskAssessment;
}
