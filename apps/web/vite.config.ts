import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cesiumImport from "vite-plugin-cesium";

// Handle CJS/ESM interop: the default export may be nested under `default`.
const cesium = ((cesiumImport as unknown as { default?: typeof cesiumImport })
  .default ?? cesiumImport) as unknown as () => import("vite").PluginOption;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), cesium()],
});
