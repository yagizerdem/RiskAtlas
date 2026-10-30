import LeafletMap2D from "@/components/2d-map";

export default function HomePage() {
  return (
    <div>
      <div className="w-[500px] h-[300px] bg-red-400">
        <LeafletMap2D />
      </div>
      home page
    </div>
  );
}
