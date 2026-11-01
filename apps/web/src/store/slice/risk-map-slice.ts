import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@store/store";
import deepmerge from "deepmerge";

export interface MapOptions {
  humanSettlementLayer: boolean;
  protectedAreasLayer: boolean;
  corineLandcoverLayer: boolean;
  fuelsLayer: boolean;
}

const defaultMapOptions: MapOptions = {
  humanSettlementLayer: false,
  protectedAreasLayer: false,
  corineLandcoverLayer: false,
  fuelsLayer: false,
};

export interface RiskMapState {
  mapOptions: MapOptions;
}

const initialState: RiskMapState = {
  mapOptions: defaultMapOptions,
};

export const riskMapSlice = createSlice({
  name: "riskMap",
  initialState,
  reducers: {
    setMapOptions: (state, action: { payload: Partial<MapOptions> }) => {
      state.mapOptions = deepmerge(state.mapOptions, action.payload);
    },
  },
});

// Action creators are generated for each case reducer function
export const { setMapOptions } = riskMapSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectMapOptions = (state: RootState) => state.riskMap.mapOptions;

export default riskMapSlice.reducer;
