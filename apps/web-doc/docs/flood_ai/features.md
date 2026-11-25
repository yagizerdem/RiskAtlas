---
sidebar_position: 4
title: Özellikler
---

Modeller 14 özellik kullanır. Hepsi `features.py` içindeki `build_features` fonksiyonu ile hesaplanır.
Sıralama `FEATURE_COLUMNS` listesinde tanımlıdır ve eğitimle tahmin arasında aynı kalmalıdır.

Enlem ve boylam bilinçli olarak özellik değildir. Böylece model, koordinatı ezberlemek yerine arazi ve
iklim koşullarından öğrenir.

## Arazi özellikleri

Her nokta için 9 yükseklik değeri alınır: noktanın kendisi, 2 km uzaklıkta 4 komşu (kuzey, doğu,
güney, batı) ve 10 km uzaklıkta 4 komşu.

| Özellik | Hesaplama | Anlamı |
| --- | --- | --- |
| `elevation` | Noktanın yüksekliği (m) | Alçak yerler daha çok su toplar |
| `relief_2km` | Nokta ve 2 km komşularında en yüksek – en alçak (m) | Yerel engebe |
| `slope_2km` | Komşularla ortalama mutlak yükseklik farkının 2000 m'ye oranının arktanjantı (derece) | Eğim. Düz alanlarda su yavaş akar |
| `tpi_2km` | Nokta – 2 km komşu ortalaması (m) | Topografik konum. Negatifse çukur veya vadi |
| `relief_10km` | Nokta ve 10 km komşularında en yüksek – en alçak (m) | Bölgesel engebe |
| `tpi_10km` | Nokta – 10 km komşu ortalaması (m) | Geniş ölçekte havza içinde olma |

## İklim özellikleri

NASA POWER'dan 2004–2023 dönemine ait günlük veriden hesaplanır.

| Özellik | Hesaplama |
| --- | --- |
| `precip_annual_mm` | Yıllık toplam yağışın ortalaması |
| `precip_max_1d_mm` | Her yılın en yağışlı gününün ortalaması |
| `precip_max_3d_mm` | Her yılın en yağışlı 3 günlük toplamının ortalaması |
| `precip_p99_mm` | Günlük yağışın %99 yüzdeliği |
| `heavy_rain_days` | Yılda 20 mm ve üzeri yağışlı gün sayısının ortalaması |
| `precip_seasonality` | Aylık ortalama yağışların değişim katsayısı (std / ortalama) |
| `soil_wetness_mean` | Kök bölgesi toprak neminin ortalaması (0–1) |
| `soil_wetness_p90` | Kök bölgesi toprak neminin %90 yüzdeliği |

Kısa süreli yoğun yağış ve zaten ıslak toprak, ani sel riskini artıran başlıca etkenlerdir. Bu yüzden
toplam yağışın yanında uç değerler ve toprak nemi de kullanılır.

## Örnek değerler

İzmir merkezi (`38.42, 27.14`) için hesaplanan arazi özellikleri:

| Özellik | Değer |
| --- | --- |
| `elevation` | 17 m |
| `tpi_2km` | -7.5 m |
| `tpi_10km` | -133.5 m |
| `relief_10km` | 392 m |

Negatif TPI değerleri, şehrin çevresinden belirgin şekilde alçak bir körfez havzasında olduğunu
gösterir.
