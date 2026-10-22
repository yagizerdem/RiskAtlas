import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;

const FT = 0.3048;
const KT = 0.514444;
const G = 9.81;
const EARTH_R = 6371000;
const rad = Cesium.Math.toRadians;

// Airliner sample model from the CesiumJS repo (served with CORS headers).
const MODEL_URL =
  "https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/models/CesiumAir/Cesium_Air.glb";
// Added to the compass heading so the model's nose points along the flight
// direction. If the plane flies sideways/backwards, change this offset.
const MODEL_HEADING_OFFSET = 0;

const PHILADELPHIA = { lon: -75.1652, lat: 39.9526 };
const NEW_YORK = { lon: -74.006, lat: 40.7128 };
const START_ALT = 2000 * FT;

const PLANE_ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'>" +
      "<path fill='#ef4444' stroke='white' stroke-width='1' " +
      "d='M12 2l2 7 8 5v2l-8-2-1 5 3 2v1.5l-4-1-4 1V21l3-2-1-5-8 2v-2l8-5z'/></svg>",
  );

/** Initial great-circle bearing (radians, clockwise from north). */
function bearing(
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
) {
  const p1 = rad(a.lat);
  const p2 = rad(b.lat);
  const dl = rad(b.lon - a.lon);
  return Math.atan2(
    Math.sin(dl) * Math.cos(p2),
    Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl),
  );
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Move `v` toward 0 by at most `step`. */
const relax = (v: number, step: number) =>
  v > 0 ? Math.max(0, v - step) : Math.min(0, v + step);

const CAPTURED_KEYS = new Set([
  "KeyW",
  "KeyS",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

interface Hud {
  throttle: number;
  pitch: number;
  roll: number;
  speedKt: number;
  altFt: number;
  heading: number;
}

function Gauge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 tabular-nums">
      <span className="text-white/60">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function App() {
  const mainRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const [hud, setHud] = useState<Hud>({
    throttle: 0.5,
    pitch: 0,
    roll: 0,
    speedKt: 0,
    altFt: 2000,
    heading: 0,
  });

  useEffect(() => {
    const mainEl = mainRef.current;
    const miniEl = miniRef.current;
    if (!mainEl || !miniEl) return;

    const noChrome = {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
    };

    const viewer = new Cesium.Viewer(mainEl, {
      ...noChrome,
      terrain: Cesium.Terrain.fromWorldTerrain(),
    });
    viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.screenSpaceCameraController.enableInputs = false;

    const minimap = new Cesium.Viewer(miniEl, {
      ...noChrome,
      sceneMode: Cesium.SceneMode.SCENE2D,
      mapProjection: new Cesium.WebMercatorProjection(),
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({
          url: "https://tile.openstreetmap.org/",
        }),
      ),
    });
    minimap.scene.screenSpaceCameraController.enableInputs = false;

    // --- Flight state -------------------------------------------------------
    const s = {
      lon: PHILADELPHIA.lon,
      lat: PHILADELPHIA.lat,
      alt: START_ALT,
      heading: bearing(PHILADELPHIA, NEW_YORK), // compass, radians
      pitch: 0,
      roll: 0,
      speed: 150, // m/s
      throttle: 0.5,
    };

    // --- Aircraft model -----------------------------------------------------
    const position = new Cesium.Cartesian3();
    const modelMatrix = new Cesium.Matrix4();
    const hpr = new Cesium.HeadingPitchRoll();
    const cameraOffset = new Cesium.HeadingPitchRange(0, rad(-12), 110);
    let model: Cesium.Model | undefined;
    let disposed = false;

    Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.alt, undefined, position);
    Cesium.Transforms.headingPitchRollToFixedFrame(
      position,
      hpr,
      undefined,
      undefined,
      modelMatrix,
    );
    Cesium.Model.fromGltfAsync({
      url: MODEL_URL,
      modelMatrix,
      minimumPixelSize: 96,
    }).then((m) => {
      if (disposed) return;
      model = m;
      viewer.scene.primitives.add(m);
    });

    Cesium.createOsmBuildingsAsync().then((buildings) => {
      if (!viewer.isDestroyed()) viewer.scene.primitives.add(buildings);
    });

    // --- Minimap: plane icon + trail -----------------------------------------
    const groundPoint = (lon: number, lat: number) =>
      Cesium.Cartesian3.fromDegrees(lon, lat, 0);
    let trail = [groundPoint(s.lon, s.lat)];
    let lastTrail = { lon: s.lon, lat: s.lat };

    minimap.entities.add({
      polyline: {
        positions: new Cesium.CallbackProperty(() => trail, false),
        width: 3,
        material: Cesium.Color.ORANGE,
      },
    });
    minimap.entities.add({
      position: new Cesium.CallbackProperty(
        () => groundPoint(s.lon, s.lat),
        false,
      ) as unknown as Cesium.PositionProperty,
      billboard: {
        image: PLANE_ICON,
        width: 32,
        height: 32,
        rotation: new Cesium.CallbackProperty(() => -s.heading, false),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    // --- Keyboard -----------------------------------------------------------
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (!CAPTURED_KEYS.has(e.code)) return;
      e.preventDefault();
      keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);
    const onBlur = () => keys.clear();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    // --- Simulation loop ----------------------------------------------------
    const axis = (pos: string, neg: string) =>
      (keys.has(pos) ? 1 : 0) - (keys.has(neg) ? 1 : 0);

    let last = performance.now();
    let lastHud = 0;

    const removeListener = viewer.scene.preUpdate.addEventListener(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      // Controls
      s.throttle = clamp(s.throttle + axis("KeyW", "KeyS") * 0.35 * dt, 0, 1);

      const pitchIn = axis("ArrowUp", "ArrowDown");
      s.pitch = pitchIn
        ? s.pitch + pitchIn * rad(18) * dt
        : relax(s.pitch, rad(5) * dt);
      s.pitch = clamp(s.pitch, rad(-30), rad(30));

      const rollIn = axis("ArrowRight", "ArrowLeft");
      s.roll = rollIn
        ? s.roll + rollIn * rad(45) * dt
        : relax(s.roll, rad(10) * dt);
      s.roll = clamp(s.roll, rad(-60), rad(60));

      // Flight dynamics: coordinated turn, thrust-driven airspeed, climb bleeds speed.
      const target = 70 + 190 * s.throttle;
      s.speed = clamp(
        s.speed +
          (target - s.speed) * 0.25 * dt -
          G * Math.sin(s.pitch) * 0.6 * dt,
        55,
        300,
      );
      s.heading += ((G * Math.tan(s.roll)) / s.speed) * dt;
      s.heading = Cesium.Math.zeroToTwoPi(s.heading);

      const horizontal = s.speed * Math.cos(s.pitch);
      s.lat += (horizontal * Math.cos(s.heading) * dt) / EARTH_R / rad(1);
      s.lon +=
        (horizontal * Math.sin(s.heading) * dt) /
        (EARTH_R * Math.cos(rad(s.lat))) /
        rad(1);
      s.alt += s.speed * Math.sin(s.pitch) * dt;

      const ground = viewer.scene.globe.getHeight(
        Cesium.Cartographic.fromDegrees(s.lon, s.lat),
      );
      s.alt = Math.max(s.alt, (ground ?? 0) + 15);

      // Model + chase camera
      Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.alt, undefined, position);
      hpr.heading = s.heading - Cesium.Math.PI_OVER_TWO + MODEL_HEADING_OFFSET;
      hpr.pitch = s.pitch;
      hpr.roll = s.roll;
      Cesium.Transforms.headingPitchRollToFixedFrame(
        position,
        hpr,
        undefined,
        undefined,
        modelMatrix,
      );
      if (model) model.modelMatrix = modelMatrix;

      cameraOffset.heading = s.heading;
      viewer.camera.lookAt(position, cameraOffset);

      // Minimap follow + trail
      const dLat = 0.15;
      const dLon = dLat / Math.cos(rad(s.lat));
      minimap.camera.setView({
        destination: Cesium.Rectangle.fromDegrees(
          s.lon - dLon,
          s.lat - dLat,
          s.lon + dLon,
          s.lat + dLat,
        ),
      });
      const movedLat = (s.lat - lastTrail.lat) * 111_320;
      const movedLon = (s.lon - lastTrail.lon) * 111_320 * Math.cos(rad(s.lat));
      if (Math.hypot(movedLat, movedLon) > 150) {
        trail = [...trail, groundPoint(s.lon, s.lat)].slice(-3000);
        lastTrail = { lon: s.lon, lat: s.lat };
      }

      if (now - lastHud > 100) {
        lastHud = now;
        setHud({
          throttle: s.throttle,
          pitch: Cesium.Math.toDegrees(s.pitch),
          roll: Cesium.Math.toDegrees(s.roll),
          speedKt: s.speed / KT,
          altFt: s.alt / FT,
          heading: Cesium.Math.toDegrees(s.heading),
        });
      }
    });

    return () => {
      disposed = true;
      removeListener();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      minimap.destroy();
      viewer.destroy();
    };
  }, []);

  return (
    <>
      <div ref={mainRef} style={{ position: "fixed", inset: 0 }} />

      <div className="pointer-events-none fixed top-4 left-4 z-10 w-56 rounded-lg bg-black/60 p-3 font-mono text-sm text-white">
        <Gauge label="SPD" value={`${hud.speedKt.toFixed(0)} kt`} />
        <Gauge label="ALT" value={`${hud.altFt.toFixed(0)} ft`} />
        <Gauge
          label="HDG"
          value={`${hud.heading.toFixed(0).padStart(3, "0")}°`}
        />
        <Gauge label="PITCH" value={`${hud.pitch.toFixed(0)}°`} />
        <Gauge label="ROLL" value={`${hud.roll.toFixed(0)}°`} />
        <div className="mt-3">
          <div className="mb-1 flex justify-between">
            <span className="text-white/60">THROTTLE</span>
            <span>{(hud.throttle * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-white/20">
            <div
              className="h-full bg-emerald-400"
              style={{ width: `${hud.throttle * 100}%` }}
            />
          </div>
        </div>
        <div className="mt-3 border-t border-white/20 pt-2 text-xs leading-5 text-white/60">
          <div>W / S — throttle</div>
          <div>↑ / ↓ — pitch</div>
          <div>← / → — roll</div>
        </div>
      </div>

      <div
        ref={miniRef}
        className="fixed right-4 bottom-4 z-10 h-60 w-60 overflow-hidden rounded-lg border-2 border-white/80 shadow-lg"
      />
    </>
  );
}

export default App;
