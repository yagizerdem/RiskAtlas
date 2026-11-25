---
sidebar_position: 2
title: Kurulum ve çalıştırma
---

## Gereksinimler

- [uv](https://docs.astral.sh/uv/getting-started/installation/) 0.13 veya üzeri
- Python 3.12 veya üzeri (uv gerekirse kendisi indirir)
- İnternet bağlantısı (hem veri seti oluşturma hem tahmin anında gerekir)

API anahtarı gerekmez. Kullanılan tüm veri kaynakları açıktır.

## Kurulum

Depo kökünden:

```bash
cd apps/flood-ai
uv sync
```

`uv sync`, `.venv` klasörünü oluşturur, bağımlılıkları kurar ve `flood_ai` paketini aşağıdaki
komutlarla birlikte kurar.

## Üç adımda çalıştırma

### 1. Veri setini oluşturma

```bash
uv run flood-ai-build-dataset
```

Komut dört adımda ilerler:

```text
[1/4] GDACS flood events 2000-2025 downloading...
[2/4] Selecting sample points...
[3/4] Fetching terrain (OpenTopoData DEM) and climate (NASA POWER) features...
[4/4] Computing labels...
```

İlk çalıştırma internet hızına göre yaklaşık 10–15 dakika sürer. 3. adım indirme sırasında çıktı
vermez. Ham API yanıtları `data/cache` altında saklanır. Komut tekrar çalıştırıldığında önbellekteki
yanıtlar yeniden indirilmez.

Örnek sayıları parametrelerle değiştirilebilir:

| Parametre | Varsayılan | Açıklama |
| --- | --- | --- |
| `--events` | `1200` | Sel olayı konumlarından alınan örnek sayısı |
| `--background` | `1000` | Dünya genelinde rastgele kara noktası sayısı |
| `--focus` | `400` | Odak kutusu içinde rastgele kara noktası sayısı |
| `--focus-bbox` | `25.6 35.8 44.8 42.1` | Odak kutusu: `MIN_LON MIN_LAT MAX_LON MAX_LAT` (Türkiye) |

Çıktı: `data/dataset.csv` ve `data/flood_events.csv`.

### 2. Modelleri eğitme

```bash
uv run flood-ai-train
```

Tüm modeller eğitilir ve test metrikleri terminale yazılır. Sadece belirli modeller eğitilebilir:

```bash
uv run flood-ai-train --models xgboost random-forest
```

Çıktı: `artifacts/models/*.joblib` ve `artifacts/metadata.json`.

### 3. API'yi başlatma

```bash
uv run flood-ai-serve
```

API varsayılan olarak `http://localhost:5001` adresinde açılır. Deneme:

```bash
curl "http://localhost:5001/predict?lat=38.42&lon=27.14"
```

Endpointlerin ayrıntıları için [API referansı](./api.md) sayfasına bakın.

## Ortam değişkenleri

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `FLOOD_AI_HOST` | `0.0.0.0` | API'nin dinlediği adres |
| `FLOOD_AI_PORT` | `5001` | API portu |
| `FLOOD_AI_DATA_DIR` | `apps/flood-ai/data` | Veri seti ve önbellek klasörü |
| `FLOOD_AI_ARTIFACTS_DIR` | `apps/flood-ai/artifacts` | Eğitilmiş modellerin klasörü |

## Komutlar

`pyproject.toml` içindeki `[project.scripts]` bölümü üç komut tanımlar:

| Komut | Çalıştırdığı fonksiyon |
| --- | --- |
| `flood-ai-build-dataset` | `flood_ai.dataset:main` |
| `flood-ai-train` | `flood_ai.train:main` |
| `flood-ai-serve` | `flood_ai.api:main` |

`data/` ve `artifacts/` klasörleri `.gitignore` içindedir ve depoya eklenmez.
