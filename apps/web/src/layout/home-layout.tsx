import { Outlet } from "react-router";

export default function HomeLayout() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col min-w-0 min-h-0 ">
      <Outlet />
    </div>
  );
}
