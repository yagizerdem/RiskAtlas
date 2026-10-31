import { useState } from "react";
import RiskMap from "@components/risk-map/risk-map";

const today = () => new Date().toISOString().slice(0, 10);

export default function RiskPage() {
  const [date, setDate] = useState(today);

  return (
    <div className="relative h-full w-full flex-1 min-h-0">
      <label className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-800 shadow">
        Tarih
        <input
          type="date"
          value={date}
          min="1940-01-01"
          max={today()}
          onChange={(e) => setDate(e.target.value || today())}
          className="outline-none"
        />
      </label>
      <RiskMap date={date} />
    </div>
  );
}
