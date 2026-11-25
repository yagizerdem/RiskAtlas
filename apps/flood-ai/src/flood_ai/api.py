"""Flask API exposing the flood risk models.

GET|POST /predict                -> all models + ensemble
GET|POST /predict/<model-name>   -> a single model
GET      /models                 -> trained models and their validation metrics
GET      /health
"""

from flask import Flask, jsonify, request

from flood_ai.config import API_HOST, API_PORT
from flood_ai.predictor import FloodRiskPredictor, ModelsNotTrainedError

app = Flask(__name__)
app.json.ensure_ascii = False
app.json.sort_keys = False

try:
    predictor = FloodRiskPredictor()
    load_error = None
except ModelsNotTrainedError as exc:
    predictor = None
    load_error = str(exc)


class BadRequest(Exception):
    pass


def _coordinates() -> tuple[float, float]:
    source = (request.get_json(silent=True) or {}) if request.method == "POST" else request.args
    lat = source.get("lat", source.get("latitude"))
    lon = source.get("lon", source.get("lng", source.get("longitude")))
    try:
        lat, lon = float(lat), float(lon)
    except (TypeError, ValueError):
        raise BadRequest("`lat` and `lon` numeric parameters are required")
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise BadRequest("Coordinates out of range (lat -90..90, lon -180..180)")
    return lat, lon


def _run(predict):
    if predictor is None:
        return jsonify(error=load_error), 503
    try:
        lat, lon = _coordinates()
        body = predict(lat, lon)
    except BadRequest as exc:
        return jsonify(error=str(exc)), 400
    except Exception as exc:  # upstream data source failures
        app.logger.exception("prediction failed")
        return jsonify(error=f"Could not compute features for this location: {exc}"), 502
    return jsonify(location={"lat": lat, "lon": lon}, **body)


@app.after_request
def cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.get("/health")
def health():
    return jsonify(
        status="ok" if predictor else "untrained",
        models=predictor.model_names if predictor else [],
    )


@app.get("/models")
def models():
    if predictor is None:
        return jsonify(error=load_error), 503
    return jsonify(
        trained_at=predictor.metadata["trained_at"],
        dataset_rows=predictor.metadata["dataset_rows"],
        models={
            name: {**info, "endpoint": f"/predict/{name}"}
            for name, info in predictor.metadata["models"].items()
        },
    )


@app.route("/predict", methods=["GET", "POST"])
def predict_all():
    return _run(lambda lat, lon: predictor.predict_all(lat, lon))


def _single_model_view(name: str):
    def view():
        return _run(lambda lat, lon: predictor.predict_one(name, lat, lon))

    view.__name__ = f"predict_{name.replace('-', '_')}"
    return view


# One dedicated endpoint per trained model, e.g. /predict/xgboost
if predictor is not None:
    for _name in predictor.model_names:
        app.add_url_rule(
            f"/predict/{_name}", view_func=_single_model_view(_name), methods=["GET", "POST"]
        )


def main():
    app.run(host=API_HOST, port=API_PORT)


if __name__ == "__main__":
    main()
