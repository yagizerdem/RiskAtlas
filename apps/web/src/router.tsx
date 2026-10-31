import { createBrowserRouter, Navigate } from "react-router";
import HomeLayout from "@/layout/home-layout";
import HomePage from "@/pages/home-page";
import RiskPage from "@/pages/risk-page";
import LoginPage from "@/pages/auth/login-page";
import RegisterPage from "@/pages/auth/register-page";
import ParticlesLayout from "@/layout/particles-layout";

const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeLayout,
    children: [
      {
        index: true,
        element: <Navigate to="home" replace />,
      },
      {
        path: "home",
        Component: HomePage,
      },
      {
        path: "risk",
        Component: RiskPage,
      },
    ],
  },
  {
    path: "/auth",
    Component: ParticlesLayout,
    children: [
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
      {
        path: "login",
        Component: LoginPage,
      },
      {
        path: "register",
        Component: RegisterPage,
      },
    ],
  },
]);

export default router;
