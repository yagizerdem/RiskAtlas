# flood-ai

Verilen koordinat için **1–10 arası sel riski** tahmin eden, birden fazla makine öğrenmesi modeli eğiten ve bunları Flask API ile sunan Python (uv) uygulaması.

## Veri kaynakları (hepsi açık, API anahtarı gerektirmez)

| Kaynak | Kullanım |
| --- | --- |
| [GDACS](https://www.gdacs.org) flood event API (2000–2025) | Etiket: gözlenmiş sel olayları |
| [OpenTopoData](https://www.opentopodata.org) (Mapzen global DEM) | Arazi özellikleri |
| [NASA POWER](https://power.larc.nasa.gov) günlük nokta API'si (2004–2023) | Yağış ve kök bölgesi toprak nemi |

**Etiket:** Her örnek noktası için yakındaki GDACS sel olaylarının uyarı seviyesine göre ağırlıklı (green=1, orange=2, red=3) Gauss çekirdek yoğunluğu (`R = 75 km`) hesaplanır ve doygun bir fonksiyonla 1–10 skora çevrilir.

**Özellikler** (`features.py`):
- Arazi: yükseklik, 2 km / 10 km rölyef, eğim, topografik konum indeksi (TPI; negatif = vadi veya çanak)
- İklim: yıllık yağış, yıllık maksimum 1 günlük ve 3 günlük yağış, %99 günlük yağış, ≥20 mm yağışlı gün sayısı, mevsimsellik, toprak nemi (ortalama ve p90)

**Örnekler:** sel olayı konumları (20 km jitter), dünya genelinde rastgele kara noktaları ve Türkiye kutusu içinde rastgele kara noktaları.

## Modeller

`linear-regression`, `random-forest`, `gradient-boosting`, `xgboost`, `knn`, `svr`, `mlp`

Ensemble skoru, modellerin doğrulama MSE değerinin tersiyle ağırlıklandırılmış ortalamasıdır.

## Kurulum ve çalıştırma

```bash
cd apps/flood-ai
uv sync

# 1) İnternetten veri çek ve veri setini oluştur (data/dataset.csv); ham yanıtlar data/cache altında saklanır
uv run flood-ai-build-dataset            # --events 1200 --background 1000 --focus 400 --focus-bbox 25.6 35.8 44.8 42.1

# 2) Tüm modelleri eğit (artifacts/models/*.joblib + artifacts/metadata.json)
uv run flood-ai-train

# 3) API'yi başlat (varsayılan port 5001; FLOOD_AI_HOST ve FLOOD_AI_PORT ile değiştirilebilir)
uv run flood-ai-serve
```

## Endpointler

| Method | Path | Açıklama |
| --- | --- | --- |
| GET/POST | `/predict?lat=38.42&lon=27.14` | Tüm modeller + ensemble |
| GET/POST | `/predict/linear-regression` | Tek model |
| GET/POST | `/predict/random-forest` | Tek model |
| GET/POST | `/predict/gradient-boosting` | Tek model |
| GET/POST | `/predict/xgboost` | Tek model |
| GET/POST | `/predict/knn` | Tek model |
| GET/POST | `/predict/svr` | Tek model |
| GET/POST | `/predict/mlp` | Tek model |
| GET | `/models` | Modeller, doğrulama metrikleri, ensemble ağırlıkları |
| GET | `/health` | Durum |

POST gövdesi: `{"lat": 38.42, "lon": 27.14}`

Örnek yanıt (`/predict`):

```json
{
  "location": {"lat": 38.42, "lon": 27.14},
  "ensemble": {"risk_score": 6, "raw_score": 6.12, "level": "moderate", "mean_score": 6.05, "std": 0.71, "models_used": 7},
  "models": {"xgboost": {"risk_score": 6, "raw_score": 6.4, "level": "moderate"}},
  "features": {"elevation": 13.0}
}
```

Seviyeler: 1–3 `low`, 4–6 `moderate`, 7–8 `high`, 9–10 `very_high`.

## Notlar

- Tahmin anında özellikler canlı olarak OpenTopoData ve NASA POWER'dan çekilir (aynı 0.5° hücre için yanıtlar diskte önbelleklenir). İlk istek birkaç saniye sürebilir.
- GDACS olay merkezleri yaklaşık konumlardır ve raporlama yoğunluğu bölgeye göre değişir. Skor, nokta ölçeğinde bir taşkın haritası değildir; bölgesel duyarlılık göstergesidir.
