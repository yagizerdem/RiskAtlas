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

export type TKBDI = {
  full_name: "KEETCH_BYRAM_DROUGHT_INDEX";
  abbreviation: "KBDI";
};

export type TMARK5 =
  | {
      full_name: "DROUGHT_FACTOR";
      abbreviation: "DF";
    }
  | {
      full_name: "RATE_OF_SPREAD";
      abbreviation: "ROS";
    }
  | {
      full_name: "FIRE_DANGER_INDEX";
      abbreviation: "FDI";
    };

export type TNFDRS =
  | {
      full_name: "NFDRS_RATE_OF_SPREAD";
      abbreviation: "NFDRS_ROS";
    }
  | {
      full_name: "NFDRS_SPREAD_COMPONENT";
      abbreviation: "NFDRS_SC";
    }
  | {
      full_name: "NFDRS_ENERGY_RELEASE_COMPONENT";
      abbreviation: "NFDRS_ERC";
    }
  | {
      full_name: "NFDRS_BURNING_INDEX";
      abbreviation: "NFDRS_BI";
    }
  | {
      full_name: "NFDRS_IGNITION_PROBABILITY";
      abbreviation: "NFDRS_IC";
    };

export interface ForecastOptions {
  // fire
  showFireDangerForecast: boolean;
  fireDangerSource: TFireForcastDangerSource;
  fireWeatherIndex: TFWI | TKBDI | TMARK5 | TNFDRS;

  // lightning
  showLightningForecast: boolean;
}

const defaultForecastOptions: ForecastOptions = {
  showFireDangerForecast: false,
  fireDangerSource: "ecmwf",
  fireWeatherIndex: {
    abbreviation: "FWI",
    full_name: "FIRE_WEATHER_INDEX",
  },
  showLightningForecast: false,
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
