---
sidebar_position: 3
title: Veri kaynakları ve etiketleme
---

## Veri kaynakları

| Kaynak | Veri | Kullanım | Erişim sınırı |
| --- | --- | --- | --- |
| [GDACS](https://www.gdacs.org) event API | 2000–2025 sel olayları (konum, uyarı seviyesi) | Etiket | Belirtilmemiş |
| [OpenTopoData](https://www.opentopodata.org) (`mapzen` veri seti) | Küresel yükseklik modeli, denizlerde batimetri | Arazi özellikleri, kara/deniz ayrımı | İstek başına 100 nokta, saniyede 1 istek, günde 1000 istek |
| [NASA POWER](https://power.larc.nasa.gov) daily point API | 2004–2023 günlük yağış (`PRECTOTCORR`) ve kök bölgesi toprak nemi (`GWETROOT`) | İklim özellikleri | Belirtilmemiş |

İstemciler `sources.py` dosyasındadır. Tüm istekler `http.py` üzerinden geçer. Bu katman hata
durumunda tekrar dener ve yanıtları `data/cache` altına JSON olarak kaydeder.

NASA POWER verisi 0.5° çözünürlüklüdür. Bu yüzden koordinatlar önce 0.5° ızgaraya yuvarlanır. Aynı
hücreye düşen noktalar için tek istek atılır.

## Örnek noktaları

Veri seti üç tür noktadan oluşur. Her satırın `source` sütunu noktanın türünü gösterir.

| `source` | Nasıl seçilir | Amaç |
| --- | --- | --- |
| `event` | Rastgele seçilen GDACS olaylarının konumu, en fazla 20 km rastgele kaydırılarak | Sel görülen yerler |
| `background` | 56°G ile 72°K enlemleri arasında, küre üzerinde eşit dağılımlı rastgele kara noktaları | Genel arka plan |
| `focus` | Odak kutusu (varsayılan Türkiye) içinde rastgele kara noktaları | Türkiye için yerel çeşitlilik |

Kaydırma, modelin olay merkezlerini ezberlemesini önler. GDACS koordinatları zaten yaklaşık
konumlardır. Kara noktaları seçilirken yükseklik 0'dan büyük olmayan noktalar deniz kabul edilip
atılır.

## Etiket: sel olay yoğunluğu

Her nokta için çevresindeki tüm GDACS olaylarından bir **olay yoğunluğu** hesaplanır:

```text
S = Σ  w(uyarı) · exp( -(d / 75 km)² )
```

- `d`: noktanın olaya haversine mesafesi (km)
- `w(uyarı)`: uyarı seviyesi ağırlığı. `green = 1`, `orange = 2`, `red = 3`

Yakındaki ve daha ciddi olaylar yoğunluğu daha çok artırır. Yaklaşık 150 km'den uzak olayların etkisi
pratikte sıfırdır.

Yoğunluk, doygun bir fonksiyonla 1–10 skora çevrilir:

```text
risk_score = 1 + 9 · S / (S + s₀)
```

`s₀`, `event` türündeki örneklerin yoğunluk medyanıdır. Hiç olay olmayan bölgeler 1'e yakın skor alır.
Medyan yoğunluktaki bir nokta 5.5 alır. Olayların yoğun olduğu bölgeler 10'a yaklaşır.

Modellerin tahmin etmeye çalıştığı hedef `risk_score` sütunudur.

## Veri seti sütunları

`data/dataset.csv` şu sütunları içerir:

| Sütun | Açıklama |
| --- | --- |
| `lat`, `lon` | Nokta koordinatı |
| `source` | `event`, `background` veya `focus` |
| özellik sütunları | [Özellikler](./features.md) sayfasındaki 14 sütun |
| `event_intensity` | Ham olay yoğunluğu `S` |
| `risk_score` | 1–10 hedef değeri |

Eksik değer içeren satırlar atılır.
