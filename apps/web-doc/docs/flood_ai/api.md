---
sidebar_position: 6
title: API referansı
---

API `api.py` dosyasında Flask ile tanımlıdır. Varsayılan adres `http://localhost:5001`.

Tüm yanıtlar JSON'dur. Yanıtlara `Access-Control-Allow-Origin: *` başlığı eklenir. Böylece web
uygulaması API'yi tarayıcıdan doğrudan çağırabilir.

## Endpointler

| Method | Path | Açıklama |
| --- | --- | --- |
| `GET`, `POST` | `/predict` | Tüm modeller ve ensemble sonucu |
| `GET`, `POST` | `/predict/linear-regression` | Sadece linear regression |
| `GET`, `POST` | `/predict/random-forest` | Sadece random forest |
| `GET`, `POST` | `/predict/gradient-boosting` | Sadece gradient boosting |
| `GET`, `POST` | `/predict/xgboost` | Sadece XGBoost |
| `GET`, `POST` | `/predict/knn` | Sadece KNN |
| `GET`, `POST` | `/predict/svr` | Sadece SVR |
| `GET`, `POST` | `/predict/mlp` | Sadece MLP |
| `GET` | `/models` | Eğitilmiş modeller, metrikler ve ağırlıklar |
| `GET` | `/health` | Servis durumu |

Tek model endpointleri, `artifacts/metadata.json` içinde bulunan her model için uygulama açılırken
otomatik oluşturulur. Sadece bir kısmı eğitildiyse yalnızca onların endpointleri açılır.

## Koordinat parametreleri

`GET` isteklerinde query string, `POST` isteklerinde JSON gövde kullanılır.

| Alan | Kabul edilen adlar | Aralık |
| --- | --- | --- |
| Enlem | `lat`, `latitude` | -90 ile 90 arası |
| Boylam | `lon`, `lng`, `longitude` | -180 ile 180 arası |

```bash
curl "http://localhost:5001/predict?lat=38.42&lon=27.14"

curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"lat": 38.42, "lon": 27.14}'
```

Her tahmin isteğinde özellikler OpenTopoData ve NASA POWER'dan canlı çekilir. Bir 0.5° hücre için
ilk istek birkaç saniye sürebilir. Sonraki istekler önbellekten gelir.

## `GET /predict`

Tüm modelleri çalıştırır ve sonuçları birleştirir.

```json
{
  "location": { "lat": 38.42, "lon": 27.14 },
  "ensemble": {
    "risk_score": 6,
    "raw_score": 6.12,
    "level": "moderate",
    "method": "inverse validation MSE weighted average",
    "mean_score": 6.05,
    "std": 0.71,
    "models_used": 7
  },
  "models": {
    "linear-regression": { "risk_score": 5, "raw_score": 5.31, "level": "moderate" },
    "xgboost": { "risk_score": 6, "raw_score": 6.4, "level": "moderate" }
  },
  "features": {
    "elevation": 17.0,
    "tpi_2km": -7.5
  }
}
```

Örnekteki skorlar yanıtın biçimini göstermek içindir. `models` alanında eğitilmiş tüm modeller,
`features` alanında 14 özelliğin tamamı bulunur.

## `GET /predict/<model>`

Tek bir modeli çalıştırır.

```bash
curl "http://localhost:5001/predict/xgboost?lat=38.42&lon=27.14"
```

```json
{
  "location": { "lat": 38.42, "lon": 27.14 },
  "model": "xgboost",
  "risk_score": 6,
  "raw_score": 6.4,
  "level": "moderate",
  "features": { "elevation": 17.0 }
}
```

## `GET /models`

```json
{
  "trained_at": "2026-11-25T14:30:00+00:00",
  "dataset_rows": 2600,
  "models": {
    "xgboost": {
      "description": "XGBoost gradient boosted trees",
      "metrics": { "rmse": 1.2, "mae": 0.9, "r2": 0.7, "within_1_point": 0.75 },
      "ensemble_weight": 0.18,
      "endpoint": "/predict/xgboost"
    }
  }
}
```

Değerler örnektir. Gerçek metrikler eğitim sonucuna göre değişir.

## `GET /health`

```json
{ "status": "ok", "models": ["linear-regression", "random-forest", "..."] }
```

Modeller henüz eğitilmediyse `status` değeri `untrained` olur ve `models` boş döner.

## Hata yanıtları

Hatalar `{"error": "..."}` biçiminde döner.

| Kod | Durum |
| --- | --- |
| `400` | `lat` veya `lon` eksik, sayı değil ya da aralık dışında |
| `502` | Özellikler dış kaynaklardan çekilemedi (ağ hatası, kota aşımı vb.) |
| `503` | Modeller eğitilmemiş. Önce veri seti oluşturma ve eğitim adımları çalıştırılmalı |
