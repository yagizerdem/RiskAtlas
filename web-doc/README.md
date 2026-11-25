# RiskAtlas dokümantasyonu

Docusaurus tabanlı dokümantasyon sitesi. Ana projenin pnpm kurulumundan
ayrı olarak npm ile yönetilir.

## Yerelde çalıştırma

Depo kökünden:

```bash
cd web-doc
npm ci
npm start
```

Adres: http://localhost:3000/RiskAtlas/

## Komutlar

| Komut | İşlev |
| --- | --- |
| `npm start` | Geliştirme sunucusu |
| `npm run build` | `build/` klasörüne üretim derlemesi |
| `npm run serve` | Üretim derlemesini yerelde önizleme |
| `npm run clear` | Docusaurus önbelleğini temizleme |
| `npm run typecheck` | TypeScript ve kurulu UI bileşenlerini kontrol etme |
| `npm run ui:add -- button` | Resmi shadcn CLI ile bileşen ekleme |
| `npm run deploy` | Derleyip `gh-pages` dalına yayınlama |

Sayfalar `docs/` klasöründedir. Kenar çubuğu otomatik oluşturulur.
Site ayarları `docusaurus.config.js` dosyasındadır.

Tailwind CSS 4 ve shadcn/ui (`base-nova`) kurulu. Tüm UI bileşenleri
`src/components/ui/` altında, tema değişkenleri `src/css/shadcn.css` içindedir.
`@/` yolu `src/` klasörünü gösterir. Kullanım örnekleri ve canlı demo,
`/RiskAtlas/ui-components/` sayfasındadır. Tooltip ve toast sağlayıcıları site
genelinde etkindir; koyu tema Docusaurus'un tema seçimini izler.

Yayın adresi: https://yagizerdem.github.io/RiskAtlas/

GitHub Pages için ilk yayından sonra depo ayarlarında **Settings → Pages →
Deploy from a branch → gh-pages → / (root)** seçilmelidir.
