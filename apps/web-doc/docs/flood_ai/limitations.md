---
sidebar_position: 8
title: Sınırlamalar ve sorun giderme
---

## Sınırlamalar

- **Skor bölgesel bir göstergedir.** Etiketler 75 km yarıçaplı olay yoğunluğundan gelir. Skor, sokak
  veya parsel ölçeğinde bir taşkın haritası değildir. Aynı bölgedeki bir dere yatağı ile bir tepe
  benzer etiket bölgesine düşebilir. Bu farkı yalnızca arazi özellikleri yansıtır.
- **GDACS raporlama yanlılığı.** GDACS daha çok büyük ve medyaya yansıyan olayları kaydeder. Olay
  merkezleri yaklaşık konumlardır. Raporlamanın az olduğu bölgelerde risk olduğundan düşük görünebilir.
- **İklim çözünürlüğü.** NASA POWER verisi 0.5° (yaklaşık 50 km) çözünürlüklüdür. Yakın noktalar aynı
  iklim özelliklerini alır.
- **Tahmin anında internet gerekir.** Özellikler canlı çekildiği için dış kaynaklara erişilemezse API
  `502` döner.

## Sorun giderme

### Veri seti oluşturma uzun süre çıktı vermiyor

3. adım indirme sırasında çıktı vermez. Bu normaldir. İlerlemeyi `data/cache` klasöründeki dosya
sayısının artmasından izleyebilirsiniz.

Bir servis kota aşımı (`429`) döndürürse istemci uzun süre beklemez. Birkaç denemeden sonra hata
verir. Önbellek korunur. Kota yenilendikten sonra komutu tekrar çalıştırmak yeterlidir.

İlk sürümde yükseklik için Open-Meteo Elevation API kullanılıyordu. Bu servis her koordinatı ayrı bir
çağrı sayar (saatte 5000, günde 10000). Veri seti yaklaşık 25.000 yükseklik noktası gerektirdiği için
OpenTopoData'ya geçildi.

### `failed to remove file ... flood-ai-build-dataset.exe: Erişim engellendi (os error 5)`

Windows, çalışan bir `.exe` dosyasının silinmesine izin vermez. Bir `flood-ai-*` komutu hâlâ
çalışırken `uv sync` veya `uv run` paketi yeniden kurmaya çalışırsa bu hata oluşur. Çalışan komutu
`Ctrl+C` ile durdurun ve tekrar deneyin.

### `Expected a Python module at: src\flood_ai\__init__.py`

Paket dosyaları `src/flood_ai/` klasöründe olmalıdır. Ayrıntı için
[Kod yapısı](./code-structure.md#srcflood_ai-düzeni) sayfasına bakın.

### `invalid console script`

`pyproject.toml` içindeki komut tanımları `paket.modül:fonksiyon` biçiminde olmalıdır, örneğin
`flood_ai.dataset:main`.

### API `503` döndürüyor

Modeller eğitilmemiş ya da `artifacts/` klasörü bulunamıyor. Önce `uv run flood-ai-build-dataset` ve
`uv run flood-ai-train` komutlarını çalıştırın. Farklı bir klasör kullanıyorsanız
`FLOOD_AI_ARTIFACTS_DIR` değişkenini kontrol edin.
