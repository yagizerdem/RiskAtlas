import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const viewer = new Cesium.Viewer(container, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      baseLayerPicker: false,
      geocoder: false,
    });

    // Looking north at San Francisco from ~5 km south, 500 m up, nearly level.
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-122.4194, 37.7249, 500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-10),
        roll: 0,
      },
    });

    Cesium.createOsmBuildingsAsync().then((buildings) => {
      if (!viewer.isDestroyed()) viewer.scene.primitives.add(buildings);
    });

    return () => viewer.destroy();
  }, []);

  return <div ref={containerRef} style={{ position: "fixed", inset: 0 }} />;
}

export default App;
