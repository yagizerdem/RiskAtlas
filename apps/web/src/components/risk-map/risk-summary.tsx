import { LEVEL_STYLE, type FireRiskAssessment } from "@lib/risk-api";

export default function RiskSummary({ risk }: { risk: FireRiskAssessment }) {
  const level = LEVEL_STYLE[risk.level];
  const { weather, fuel, terrain } = risk.components;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{risk.score}</span>
        <span className="font-medium" style={{ color: level.color }}>
          {level.label}
        </span>
      </div>
      <table className="w-full">
        <tbody>
          <tr>
            <td className="pr-2 text-gray-500">Hava (FWI)</td>
            <td>
              {weather.available
                ? `${weather.fwi.toFixed(1)} · ${weather.dangerLabel}`
                : "veri yok"}
            </td>
          </tr>
          <tr>
            <td className="pr-2 text-gray-500">Yakıt</td>
            <td>
              {fuel.label} · {fuel.flammability}
            </td>
          </tr>
          <tr>
            <td className="pr-2 text-gray-500">Eğim</td>
            <td>
              {terrain.slopeDeg}° · ×{terrain.slopeFactor}
            </td>
          </tr>
          <tr>
            <td className="pr-2 text-gray-500">Yükseklik</td>
            <td>{terrain.elevationM === null ? "—" : `${terrain.elevationM} m`}</td>
          </tr>
        </tbody>
      </table>
      {risk.mode === "static" && (
        <p className="text-xs text-gray-500">
          Hava verisi olmadan hesaplandı (yakıt × eğim).
        </p>
      )}
    </div>
  );
}
