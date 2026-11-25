---
sidebar_position: 1
title: Genel bakış
---

`apps/flood-ai`, verilen bir koordinat için **1–10 arası sel riski** tahmin eden Python uygulamasıdır.
Uygulama açık internet kaynaklarından veri toplar, bu veriyle yedi farklı makine öğrenmesi modeli
eğitir ve modelleri bir Flask API üzerinden sunar.

Uygulama pnpm çalışma alanının parçası değildir. Bağımlılıkları [uv](https://docs.astral.sh/uv/)
ile yönetilir ve kendi `pyproject.toml` ve `uv.lock` dosyaları vardır.

## Ne yapar?

1. **Veri toplar:** GDACS sel olay arşivinden gözlenmiş sel olaylarını, OpenTopoData'dan yükseklik
   verisini, NASA POWER'dan 20 yıllık günlük yağış ve toprak nemi verisini indirir.
2. **Veri seti oluşturur:** Dünya genelinde ve Türkiye içinde örnek noktalar seçer. Her nokta için
   arazi ve iklim özelliklerini hesaplar ve yakındaki sel olaylarından 1–10 arası bir etiket üretir.
3. **Modelleri eğitir:** Linear regression, random forest, gradient boosting, XGBoost, KNN, SVR ve
   MLP modellerini eğitir ve test setindeki başarılarını ölçer.
4. **API ile sunar:** İstenen koordinatın özelliklerini canlı olarak çeker ve tüm modellerin
   sonuçlarını tek tek ve birleştirilmiş (ensemble) olarak döner.

## Akış

```text
GDACS sel olayları ──────────────┐
                                 ├─► dataset.py ─► data/dataset.csv ─► train.py ─► artifacts/
OpenTopoData + NASA POWER ───────┘        ▲                                          │
           │                              │                                          ▼
           └──────────► features.py ──────┴────────────► predictor.py ◄──── models/*.joblib
                                                              │
                                                              ▼
                                                     api.py (Flask, :5001)
```

Eğitim ve tahmin aynı `features.py` kodunu kullanır. Bu sayede model, eğitimde gördüğü özellikleri
tahmin anında da aynı şekilde hesaplanmış olarak alır.

## Bölümler

- [Kurulum ve çalıştırma](./setup.md)
- [Veri kaynakları ve etiketleme](./data-and-labels.md)
- [Özellikler](./features.md)
- [Modeller ve ensemble](./models.md)
- [API referansı](./api.md)
- [Kod yapısı](./code-structure.md)
- [Sınırlamalar ve sorun giderme](./limitations.md)
