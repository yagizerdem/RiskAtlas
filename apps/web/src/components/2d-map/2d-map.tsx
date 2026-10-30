import { MapContainer, TileLayer } from "react-leaflet";
import LocationMarker from "@components/2d-map/location-marker";

export default function LeafletMap2D() {
  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={13}
      className="h-full w-full"
      bounceAtZoomLimits={true}
      doubleClickZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <LocationMarker />
    </MapContainer>
  );
}
