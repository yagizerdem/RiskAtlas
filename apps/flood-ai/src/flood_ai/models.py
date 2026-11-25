"""Registry of the regression models trained to predict the 1-10 flood risk score."""

from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from xgboost import XGBRegressor

from flood_ai.config import RANDOM_SEED

MODEL_DESCRIPTIONS = {
    "linear-regression": "Linear regression (standardised features)",
    "random-forest": "Random forest regressor",
    "gradient-boosting": "Gradient boosting regressor (scikit-learn)",
    "xgboost": "XGBoost gradient boosted trees",
    "knn": "k-nearest neighbours regressor",
    "svr": "Support vector regression (RBF kernel)",
    "mlp": "Multi-layer perceptron neural network",
}

MODEL_NAMES = list(MODEL_DESCRIPTIONS)


def create_model(name: str):
    if name == "linear-regression":
        return make_pipeline(StandardScaler(), LinearRegression())
    if name == "random-forest":
        return RandomForestRegressor(
            n_estimators=400, min_samples_leaf=2, n_jobs=-1, random_state=RANDOM_SEED
        )
    if name == "gradient-boosting":
        return GradientBoostingRegressor(
            n_estimators=400, learning_rate=0.05, max_depth=4, subsample=0.8, random_state=RANDOM_SEED
        )
    if name == "xgboost":
        return XGBRegressor(
            n_estimators=600,
            learning_rate=0.03,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            random_state=RANDOM_SEED,
            n_jobs=-1,
        )
    if name == "knn":
        return make_pipeline(StandardScaler(), KNeighborsRegressor(n_neighbors=15, weights="distance"))
    if name == "svr":
        return make_pipeline(StandardScaler(), SVR(C=3.0, epsilon=0.2))
    if name == "mlp":
        return make_pipeline(
            StandardScaler(),
            MLPRegressor(
                hidden_layer_sizes=(64, 32),
                alpha=1e-3,
                max_iter=3000,
                early_stopping=True,
                random_state=RANDOM_SEED,
            ),
        )
    raise KeyError(f"Unknown model: {name}")
