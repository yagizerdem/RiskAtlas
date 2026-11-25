---
sidebar_position: 5
title: Modeller ve ensemble
---

Tüm modeller regresyon modelidir ve doğrudan 1–10 arası `risk_score` değerini tahmin eder. Model
tanımları `models.py` dosyasındaki `create_model` fonksiyonundadır.

## Modeller

| Ad (endpoint) | Model | Ön işleme | Ana ayarlar |
| --- | --- | --- | --- |
| `linear-regression` | `LinearRegression` | `StandardScaler` | – |
| `random-forest` | `RandomForestRegressor` | – | 400 ağaç, `min_samples_leaf=2` |
| `gradient-boosting` | `GradientBoostingRegressor` | – | 400 ağaç, `learning_rate=0.05`, `max_depth=4`, `subsample=0.8` |
| `xgboost` | `XGBRegressor` | – | 600 ağaç, `learning_rate=0.03`, `max_depth=6`, `subsample=0.8`, `colsample_bytree=0.8` |
| `knn` | `KNeighborsRegressor` | `StandardScaler` | 15 komşu, mesafe ağırlıklı |
| `svr` | `SVR` (RBF çekirdek) | `StandardScaler` | `C=3.0`, `epsilon=0.2` |
| `mlp` | `MLPRegressor` | `StandardScaler` | Katmanlar 64 ve 32, `alpha=1e-3`, erken durdurma |

Ölçeğe duyarlı modeller (linear, KNN, SVR, MLP) `StandardScaler` ile bir `Pipeline` içinde tutulur.
Ağaç tabanlı modeller ham özellikleri kullanır. Rastgelelik içeren modellerde `random_state=42`
kullanılır.

Yeni bir model eklemek için `MODEL_DESCRIPTIONS` sözlüğüne bir ad ekleyip `create_model` içinde
karşılığını tanımlamak yeterlidir. Eğitim, kayıt ve API endpointi bu listeden otomatik oluşur.

## Eğitim

`train.py` her model için şu adımları izler:

1. Veri seti `source` sütununa göre katmanlı olarak %80 eğitim ve %20 test olarak bölünür.
2. Model eğitim setinde eğitilir. Test seti tahminleri 1–10 aralığına kırpılır ve ölçülür.
3. Sunulacak model **tüm veri setiyle** yeniden eğitilir ve `artifacts/models/<ad>.joblib` olarak
   kaydedilir.

Ölçülen metrikler:

| Metrik | Açıklama |
| --- | --- |
| `rmse` | Kök ortalama kare hata (skor puanı cinsinden) |
| `mae` | Ortalama mutlak hata |
| `r2` | Açıklanan varyans oranı |
| `within_1_point` | Yuvarlanmış tahminin gerçek skora en fazla 1 puan uzak olduğu örneklerin oranı |

Metrikler, eğitim zamanı ve veri seti boyutu `artifacts/metadata.json` dosyasına yazılır ve
[`GET /models`](./api.md#get-models) endpointinden okunabilir.

## Ensemble

`/predict` endpointi tüm modellerin sonucunu birleştirir. Her modelin ağırlığı, test setindeki hata
karesinin (MSE) tersiyle orantılıdır:

```text
ağırlık(m) = (1 / rmse(m)²) / Σ (1 / rmse(k)²)
ensemble   = Σ ağırlık(m) · tahmin(m)
```

Daha başarılı modellerin sonuca etkisi daha büyüktür. Ağırlıklar eğitim sırasında hesaplanıp
`metadata.json` içinde `ensemble_weight` olarak saklanır.

Ensemble yanıtında ayrıca şunlar bulunur:

- `mean_score`: modellerin ağırlıksız ortalaması
- `std`: modeller arasındaki standart sapma. Yüksek değer, modellerin bu konum için anlaşamadığını
  gösterir.

## Skorun yorumlanması

Her tahmin önce 1–10 aralığına kırpılır, sonra en yakın tam sayıya yuvarlanır.

| `risk_score` | `level` |
| --- | --- |
| 1–3 | `low` |
| 4–6 | `moderate` |
| 7–8 | `high` |
| 9–10 | `very_high` |

`raw_score` alanı yuvarlanmamış değeri verir.
