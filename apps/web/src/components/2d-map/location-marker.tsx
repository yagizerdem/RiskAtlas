import { useState } from "react";
import { Marker, Popup, useMapEvents } from "react-leaflet";
import type { LatLng } from "leaflet";

export default function LocationMarker() {
  const [position, setPosition] = useState<LatLng | null>(null);
  useMapEvents({
    dblclick(e) {
      setPosition(e.latlng);
    },
  });

  console.log("position", position);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}
