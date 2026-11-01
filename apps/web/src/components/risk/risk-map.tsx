import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMapEvents,
  WMSTileLayer,
} from "react-leaflet";
import type { LatLng } from "leaflet";
import RiskSummary from "@components/risk/risk-summary";
import {
  fetchFireRisk,
  LEVEL_STYLE,
  type FireRiskAssessment,
} from "@lib/risk-api";
import { useEventEmitter } from "@hooks/use-event-emitter";
import type { ResizeRiskMapEvent } from "@components/risk/type";
import { useSelector } from "react-redux";
import { selectMapOptions } from "@/store/slice/risk-map-slice";

type Probe =
  | { status: "loading"; position: LatLng }
  | { status: "done"; position: LatLng; risk: FireRiskAssessment }
  | { status: "error"; position: LatLng; message: string };

const IZMIR: [number, number] = [38.42, 27.14];

function ClickToAssess({
  date,
  onProbe,
}: {
  date?: string;
  onProbe: (probe: Probe) => void;
}) {
  const pending = useRef<AbortController | null>(null);

  useMapEvents({
    async click(e) {
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;

      const position = e.latlng;
      onProbe({ status: "loading", position });
      try {
        const risk = await fetchFireRisk(
          position.lat,
          position.lng,
          date,
          controller.signal,
        );
        onProbe({ status: "done", position, risk });
      } catch (err) {
        if (controller.signal.aborted) return;
        onProbe({ status: "error", position, message: String(err) });
      }
    },
  });

  return null;
}

interface RiskMapProps {
  date?: string;
}

const GWIS_WMS = "https://maps.effis.emergency.copernicus.eu/gwis";

export default function RiskMap({ date }: RiskMapProps) {
  const [probe, setProbe] = useState<Probe | null>(null);
  const level = probe?.status === "done" ? probe.risk.structural.level : null;
  const color = level ? LEVEL_STYLE[level].color : "#64748b";
  const { eventData } = useEventEmitter<ResizeRiskMapEvent>("resize-risk-map");
  const mapRef = useRef<ComponentRef<typeof MapContainer>>(null);
  const mapOptions = useSelector(selectMapOptions);

  useEffect(() => {
    if (eventData?.resizeLeafletMap && mapRef.current) {
      mapRef.current.invalidateSize();
    }
  }, [eventData]);

  return (
    <MapContainer
      center={IZMIR}
      zoom={10}
      className="h-full w-full"
      ref={mapRef}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
      />
      <ClickToAssess date={date} onProbe={setProbe} />
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

      {mapOptions.countryBoundariesLayer && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri"
        />
      )}

      {/* map layers */}

      {/* Human Settlement */}
      {mapOptions.humanSettlementLayer && (
        <WMSTileLayer
          url={GWIS_WMS}
          layers="ghsl"
          format="image/png"
          transparent
          opacity={0.7}
          attribution="GWIS"
        />
      )}

      {/* Fuels */}

      {mapOptions.fuelsLayer && (
        <WMSTileLayer
          url={GWIS_WMS}
          layers="fuel_map"
          format="image/png"
          transparent
          opacity={0.7}
        />
      )}

      {/* Protected Areas */}
      {mapOptions.protectedAreasLayer && (
        <WMSTileLayer
          url={GWIS_WMS}
          layers="wdpa.poly"
          format="image/png"
          transparent
          opacity={0.7}
        />
      )}

      {/* Modis Landcover */}
      {mapOptions.modisLandcoverLayer && (
        <WMSTileLayer
          url={GWIS_WMS}
          layers="landcover.mcd12.orig.2024"
          format="image/png"
          transparent
          opacity={0.7}
          version="1.1.1"
        />
      )}

      {/* CORINE Land Cover 2018 */}
      {mapOptions.corineLandcoverLayer && (
        <WMSTileLayer
          url="https://image.discomap.eea.europa.eu/arcgis/services/Corine/CLC2018_WM/MapServer/WMSServer"
          layers="12"
          format="image/png"
          transparent
          opacity={0.7}
          version="1.1.1"
          attribution="Copernicus Land Monitoring Service / EEA"
        />
      )}
    </MapContainer>
  );
}
