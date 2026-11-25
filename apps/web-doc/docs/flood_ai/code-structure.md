---
sidebar_position: 7
title: Kod yapısı
---

```text
apps/flood-ai/
├── pyproject.toml          # proje tanımı, bağımlılıklar, komutlar
├── uv.lock                 # kilitli bağımlılık sürümleri
├── .python-version         # 3.12
├── README.md
├── src/
│   └── flood_ai/           # Python paketi
│       ├── __init__.py
│       ├── config.py
│       ├── http.py
│       ├── sources.py
│       ├── features.py
│       ├── dataset.py
│       ├── models.py
│       ├── train.py
│       ├── predictor.py
│       └── api.py
├── data/                   # oluşturulur, git'e eklenmez
│   ├── cache/              # ham API yanıtları
│   ├── flood_events.csv
│   └── dataset.csv
└── artifacts/              # oluşturulur, git'e eklenmez
    ├── metadata.json
    └── models/*.joblib
```

## `src/flood_ai` düzeni

Proje uv'nin **src layout** düzenini kullanır. `uv_build`, proje adından (`flood-ai`) türettiği
`flood_ai` paketini `src/flood_ai/__init__.py` konumunda arar. Dosyalar doğrudan `src/` altına
taşınırsa kurulum `Expected a Python module at: src\flood_ai\__init__.py` hatasıyla durur.

Tüm importlar paket adıyla yazılır, örneğin `from flood_ai.config import DATA_DIR`. Modüller tek bir
`flood_ai` isim alanında durduğu için `http.py` gibi adlar Python'un kendi `http` modülüyle çakışmaz.

## Modüller

| Modül | Görev |
| --- | --- |
| `config.py` | Klasör yolları, tarih aralıkları, etiket parametreleri, API adresi. Ortam değişkenlerini okur. |
| `http.py` | Ortak `requests` oturumu. 429 ve 5xx hatalarında üstel bekleme ile tekrar dener, yanıtları diske önbellekler. |
| `sources.py` | OpenTopoData, NASA POWER ve GDACS istemcileri. OpenTopoData istekleri saniyede bire sınırlanır. |
| `features.py` | Arazi ve iklim özelliklerini hesaplar. NASA POWER isteklerini 8 iş parçacığıyla paralel atar. |
| `dataset.py` | Örnek noktalarını seçer, olay yoğunluğu etiketini hesaplar, `dataset.csv` dosyasını yazar. |
| `models.py` | Model listesi ve model oluşturma fonksiyonu. |
| `train.py` | Modelleri eğitir, ölçer, kaydeder ve ensemble ağırlıklarını hesaplar. |
| `predictor.py` | Kayıtlı modelleri yükler, tek model ve ensemble tahmini üretir, skoru seviyeye çevirir. |
| `api.py` | Flask uygulaması ve endpointler. |

## Bağımlılıklar

| Paket | Kullanım |
| --- | --- |
| `flask` | HTTP API |
| `scikit-learn` | Linear regression, random forest, gradient boosting, KNN, SVR, MLP, metrikler |
| `xgboost` | XGBoost modeli |
| `pandas`, `numpy` | Veri işleme |
| `requests` | Dış API çağrıları |
| `joblib` | Modelleri kaydetme ve yükleme |

Yeni bağımlılık eklemek için `apps/flood-ai` içinde `uv add <paket>` kullanın.
