"""Train every registered model on the dataset and store them under artifacts/."""

import argparse
import json
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from flood_ai.config import ARTIFACTS_DIR, DATASET_PATH, RANDOM_SEED
from flood_ai.features import FEATURE_COLUMNS
from flood_ai.models import MODEL_DESCRIPTIONS, MODEL_NAMES, create_model

METADATA_PATH = ARTIFACTS_DIR / "metadata.json"


def model_path(name: str):
    return ARTIFACTS_DIR / "models" / f"{name}.joblib"


def train(dataset_path=DATASET_PATH, names=MODEL_NAMES, test_size=0.2):
    df = pd.read_csv(dataset_path)
    X, y = df[FEATURE_COLUMNS], df["risk_score"]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=RANDOM_SEED, stratify=df["source"]
    )
    print(f"Data: {len(df)} rows (train {len(X_train)}, test {len(X_test)})")

    (ARTIFACTS_DIR / "models").mkdir(parents=True, exist_ok=True)
    metrics = {}
    for name in names:
        model = create_model(name)
        model.fit(X_train, y_train)
        pred = np.clip(model.predict(X_test), 1, 10)
        metrics[name] = {
            "rmse": float(np.sqrt(mean_squared_error(y_test, pred))),
            "mae": float(mean_absolute_error(y_test, pred)),
            "r2": float(r2_score(y_test, pred)),
            "within_1_point": float(np.mean(np.abs(np.rint(pred) - np.rint(y_test)) <= 1)),
        }
        print(
            f"  {name:<18} RMSE={metrics[name]['rmse']:.3f}  MAE={metrics[name]['mae']:.3f}  "
            f"R2={metrics[name]['r2']:.3f}"
        )
        # The served model is refit on the full dataset
        joblib.dump(create_model(name).fit(X, y), model_path(name))

    inverse_mse = {n: 1.0 / m["rmse"] ** 2 for n, m in metrics.items()}
    total = sum(inverse_mse.values())
    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_rows": len(df),
        "feature_columns": FEATURE_COLUMNS,
        "models": {
            n: {
                "description": MODEL_DESCRIPTIONS[n],
                "metrics": metrics[n],
                "ensemble_weight": inverse_mse[n] / total,
            }
            for n in names
        },
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Models saved: {ARTIFACTS_DIR}")
    return metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default=str(DATASET_PATH))
    parser.add_argument("--models", nargs="+", choices=MODEL_NAMES, default=MODEL_NAMES)
    args = parser.parse_args()
    train(args.dataset, args.models)


if __name__ == "__main__":
    main()
