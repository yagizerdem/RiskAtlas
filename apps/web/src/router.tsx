import { createBrowserRouter } from "react-router";
import HomeLayout from "@/layout/home-layout";
import HomePage from "@/pages/home-page";

const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeLayout,
    children: [{ index: true, Component: HomePage }],
  },
]);

export default router;
