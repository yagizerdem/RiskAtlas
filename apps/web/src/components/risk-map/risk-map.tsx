import { useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";
import type { LatLng } from "leaflet";
import RiskSummary from "@components/risk-map/risk-summary";
import { fetchFireRisk, LEVEL_STYLE, type FireRiskAssessment } from "@lib/risk-api";

type Probe =
  | { status: "loading"; position: LatLng }
  | { status: "done"; position: LatLng; risk: FireRiskAssessment }
  | { status: "error"; position: LatLng; message: string };

const IZMIR: [number, number] = [38.42, 27.14];

function ClickToAssess({ onProbe }: { onProbe: (probe: Probe) => void }) {
  const pending = useRef<AbortController | null>(null);

  useMapEvents({
    async click(e) {
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;

      const position = e.latlng;
      onProbe({ status: "loading", position });
      try {
        const risk = await fetchFireRisk(position.lat, position.lng, controller.signal);
        onProbe({ status: "done", position, risk });
      } catch (err) {
        if (controller.signal.aborted) return;
        onProbe({ status: "error", position, message: String(err) });
      }
    },
  });

  return null;
}

export default function RiskMap() {
  const [probe, setProbe] = useState<Probe | null>(null);
  const color =
    probe?.status === "done" ? LEVEL_STYLE[probe.risk.level].color : "#64748b";

  return (
    <MapContainer center={IZMIR} zoom={10} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      <ClickToAssess onProbe={setProbe} />
      {probe && (
        <CircleMarker
          // re-mount so the popup opens again for every new click
          key={`${probe.position.lat},${probe.position.lng},${probe.status}`}
          center={probe.position}
          radius={10}
          pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
          eventHandlers={{ add: (e) => e.target.openPopup() }}
        >
          <Popup minWidth={240}>
            {probe.status === "loading" && "Risk hesaplanıyor…"}
            {probe.status === "error" && `Hata: ${probe.message}`}
            {probe.status === "done" && <RiskSummary risk={probe.risk} />}
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
