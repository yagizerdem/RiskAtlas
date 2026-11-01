import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@store/slice/auth-slice";
import riskMapReducer from "@store/slice/risk-map-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    riskMap: riskMapReducer,
  },
});

// Infer the `RootState`, `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
