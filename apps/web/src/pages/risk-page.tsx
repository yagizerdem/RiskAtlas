import RiskMap from "@/components/risk/risk-map";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useEventEmitter } from "@/hooks/use-event-emitter";
import type { ResizeRiskMapEvent } from "@components/risk/type";
import LeftSidebar from "@/components/risk/left-sidebar/left-sidebar";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSelectedDate,
  setSelectedDate,
} from "@/store/slice/risk-map-slice";
import { today } from "@/lib/utils";

export default function RiskPage() {
  const selectedDate = useSelector(selectSelectedDate);
  const dispatch = useDispatch();

  const { publishEvent } =
    useEventEmitter<ResizeRiskMapEvent>("resize-risk-map");

  function handleResizeRiskMap() {
    publishEvent({ resizeLeafletMap: true });
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="relative h-full w-full flex-1 min-h-0 flex flex-row"
    >
      <ResizablePanel
        defaultSize="25%"
        minSize="150px"
        maxSize="40%"
        className="flex flex-col"
      >
        <LeftSidebar />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel onResize={handleResizeRiskMap}>
        <div className="flex-1  w-full h-full">
          <label className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-800 shadow">
            Tarih
            <input
              type="date"
              value={selectedDate}
              min="1940-01-01"
              max={today()}
              onChange={(e) => {
                dispatch(setSelectedDate(e.target.value || today()));
              }}
              className="outline-none"
            />
          </label>
          <RiskMap date={selectedDate} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
