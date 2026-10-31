import { RouterProvider } from "react-router";
import router from "@/router";
import { Toaster } from "@components/ui/sonner";
import { Fragment } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { app as firebaseApp } from "@lib/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useDispatch } from "react-redux";
import { setIsLoggedIn } from "@store/auth/slice/auth-slice";

export default function App() {
  const guard = useRef<number>(0);
  const dispatch = useDispatch();

  useEffect(() => {
    if (guard.current > 0) return;
    guard.current++;
    const auth = getAuth(firebaseApp);
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        dispatch(setIsLoggedIn(true));
      } else {
        // User is signed out
        dispatch(setIsLoggedIn(false));
      }
    });
  }, []);

  return (
    <Fragment>
      <RouterProvider router={router} />
      <Toaster />
    </Fragment>
  );
}
