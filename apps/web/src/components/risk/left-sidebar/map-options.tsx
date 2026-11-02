import { Checkbox } from "@components/ui/checkbox";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@components/ui/field";

import { useDispatch, useSelector } from "react-redux";

import {
  selectMapOptions,
  setMapOptions,
  type MapOptions,
} from "@store/slice/risk-map-slice";

const LAYERS: { key: keyof MapOptions; label: string }[] = [
  { key: "humanSettlementLayer", label: "Settlement areas" },
  { key: "protectedAreasLayer", label: "Protected areas" },
  { key: "modisLandcoverLayer", label: "MODIS land cover" },
  { key: "corineLandcoverLayer", label: "CORINE land cover" },
  { key: "fuelsLayer", label: "Fuel types" },
  { key: "countryBoundariesLayer", label: "Country boundaries" },
];

export default function MapOptions() {
  const mapOptions = useSelector(selectMapOptions);
  const dispatch = useDispatch();

  function handleLayerChange(key: keyof MapOptions, checked: boolean) {
    dispatch(setMapOptions({ [key]: checked }));
  }

  return (
    <FieldSet>
      <FieldLegend variant="label">Map Options</FieldLegend>
      <FieldGroup data-slot="checkbox-group">
        {LAYERS.map(({ key, label }) => (
          <Field key={key} orientation="horizontal">
            <Checkbox
              id={key}
              checked={mapOptions[key]}
              onCheckedChange={(checked) => handleLayerChange(key, checked)}
              className="border border-black cursor-pointer"
            />
            <FieldLabel htmlFor={key} className="font-normal">
              {label}
            </FieldLabel>
          </Field>
        ))}
      </FieldGroup>
    </FieldSet>
  );
}
