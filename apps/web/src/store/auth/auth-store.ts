import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@store/auth/slice/auth-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Infer the `RootState`, `AppDispatch`, and `AppStore` types from the store itself
export type AuthRootState = ReturnType<typeof store.getState>;
export type AuthDispatch = typeof store.dispatch;
export type AuthStore = typeof store;
