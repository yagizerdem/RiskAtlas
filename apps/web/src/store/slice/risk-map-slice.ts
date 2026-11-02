import { today } from "@lib/utils";
import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@store/store";
import deepmerge from "deepmerge";

export interface MapOptions {
  humanSettlementLayer: boolean;
  protectedAreasLayer: boolean;
  modisLandcoverLayer: boolean;
  corineLandcoverLayer: boolean;
  fuelsLayer: boolean;
  countryBoundariesLayer: boolean;
}

const defaultMapOptions: MapOptions = {
  humanSettlementLayer: false,
  protectedAreasLayer: false,
  modisLandcoverLayer: false,
  corineLandcoverLayer: false,
  fuelsLayer: false,
  countryBoundariesLayer: false,
};

export type TFireForcastDangerSource = "ecmwf" | "mf025" | "nasa_geos5";
export type TFWI =
  | {
      full_name: "FIRE_WEATHER_INDEX";
      abbreviation: "FWI";
    }
  | {
      full_name: "INITIAL_SPREAD_INDEX";
      abbreviation: "ISI";
    }
  | {
      full_name: "BUILD_UP_INDEX";
      abbreviation: "BUI";
    }
  | {
      full_name: "FINE_FUEL_MOISTURE_CODE";
      abbreviation: "FFMC";
    }
  | {
      full_name: "DUFF_MOISTURE_CODE";
      abbreviation: "DMC";
    }
  | {
      full_name: "DROUGHT_CODE";
      abbreviation: "DC";
    }
  | {
      full_name: "ANOMALY";
      abbreviation: "FWI";
    }
  | {
      full_name: "RANKING";
      abbreviation: "FWI";
    };

export interface ForecastOptions {
  showFireDangerForecast: boolean;
  fireDangerSource: TFireForcastDangerSource;
  fireWeatherIndex: TFWI;
}

const defaultForecastOptions: ForecastOptions = {
  showFireDangerForecast: false,
  fireDangerSource: "ecmwf",
  fireWeatherIndex: {
    abbreviation: "FWI",
    full_name: "FIRE_WEATHER_INDEX",
  },
};

export interface RiskMapState {
  mapOptions: MapOptions;
  selectedDate: string;
  forecastOptions: ForecastOptions;
}

const initialState: RiskMapState = {
  mapOptions: defaultMapOptions,
  selectedDate: today(),
  forecastOptions: defaultForecastOptions,
};

export const riskMapSlice = createSlice({
  name: "riskMap",
  initialState,
  reducers: {
    setMapOptions: (state, action: { payload: Partial<MapOptions> }) => {
      state.mapOptions = deepmerge(state.mapOptions, action.payload);
    },
    setSelectedDate: (state, action: { payload: string }) => {
      state.selectedDate = action.payload;
    },
    setForecastOptions: (
      state,
      action: { payload: Partial<ForecastOptions> },
    ) => {
      state.forecastOptions = deepmerge(state.forecastOptions, action.payload);
    },
  },
});

// Action creators are generated for each case reducer function
export const { setMapOptions, setSelectedDate, setForecastOptions } =
  riskMapSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectMapOptions = (state: RootState) => state.riskMap.mapOptions;
export const selectSelectedDate = (state: RootState) =>
  state.riskMap.selectedDate;
export const selectForecastOptions = (state: RootState) =>
  state.riskMap.forecastOptions;

export default riskMapSlice.reducer;
