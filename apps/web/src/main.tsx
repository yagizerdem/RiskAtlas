import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App.tsx";
import "leaflet/dist/leaflet.css"; // setup leaflet css before rendering the map
import { BaseProvider } from "@/providers/base-provider";

createRoot(document.getElementById("root")!).render(
  <BaseProvider>
    <App />
  </BaseProvider>,
);
