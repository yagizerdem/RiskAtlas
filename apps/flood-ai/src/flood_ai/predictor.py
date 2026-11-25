import json

import joblib
import numpy as np

from flood_ai.features import FEATURE_COLUMNS, build_features
from flood_ai.train import METADATA_PATH, model_path


class ModelsNotTrainedError(RuntimeError):
    pass


def risk_level(score: int) -> str:
    if score <= 3:
        return "low"
    if score <= 6:
        return "moderate"
    if score <= 8:
        return "high"
    return "very_high"


def _result(raw: float) -> dict:
    raw = float(np.clip(raw, 1, 10))
    score = int(np.clip(np.rint(raw), 1, 10))
    return {"risk_score": score, "raw_score": round(raw, 3), "level": risk_level(score)}


class FloodRiskPredictor:
    def __init__(self):
        if not METADATA_PATH.exists():
            raise ModelsNotTrainedError(
                "Trained models not found. Run `uv run flood-ai-build-dataset` and `uv run flood-ai-train` first."
            )
        self.metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        self.models = {name: joblib.load(model_path(name)) for name in self.metadata["models"]}

    @property
    def model_names(self) -> list[str]:
        return list(self.models)

    def features_for(self, lat: float, lon: float):
        return build_features([lat], [lon])[FEATURE_COLUMNS]

    def predict_one(self, name: str, lat: float, lon: float) -> dict:
        features = self.features_for(lat, lon)
        return {
            "model": name,
            **_result(self.models[name].predict(features)[0]),
            "features": features.iloc[0].round(4).to_dict(),
        }

    def predict_all(self, lat: float, lon: float) -> dict:
        features = self.features_for(lat, lon)
        raw = {n: float(np.clip(m.predict(features)[0], 1, 10)) for n, m in self.models.items()}
        weights = {n: self.metadata["models"][n]["ensemble_weight"] for n in raw}
        weighted = sum(raw[n] * weights[n] for n in raw) / sum(weights.values())
        values = np.array(list(raw.values()))
        return {
            "ensemble": {
                **_result(weighted),
                "method": "inverse validation MSE weighted average",
                "mean_score": round(float(values.mean()), 3),
                "std": round(float(values.std()), 3),
                "models_used": len(raw),
            },
            "models": {n: _result(v) for n, v in raw.items()},
            "features": features.iloc[0].round(4).to_dict(),
        }
