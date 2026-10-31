import { RouterProvider } from "react-router";
import router from "@/router";
import { Toaster } from "@components/ui/sonner";
import { Fragment } from "react/jsx-runtime";

export default function App() {
  return (
    <Fragment>
      <RouterProvider router={router} />
      <Toaster />
    </Fragment>
  );
}
