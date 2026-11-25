# RiskAtlas dokümantasyonu

Docusaurus ve TypeScript tabanlı dokümantasyon sitesi. Depo kökündeki pnpm
çalışma alanının parçasıdır.

## Yerelde çalıştırma

Depo kökünden:

```bash
pnpm install
cd apps/web-doc
pnpm start
```

Adres: http://localhost:3000/RiskAtlas/

## Komutlar

| Komut | İşlev |
| --- | --- |
| `pnpm start` | Geliştirme sunucusu |
| `pnpm build` | `build/` klasörüne üretim derlemesi |
| `pnpm serve` | Üretim derlemesini yerelde önizleme |
| `pnpm clear` | Docusaurus önbelleğini temizleme |
| `pnpm typecheck` | TypeScript ve kurulu UI bileşenlerini kontrol etme |
| `pnpm ui:add button` | Resmi shadcn CLI ile bileşen ekleme |
| `pnpm run deploy` | Derleyip `gh-pages` dalına yayınlama |

Sayfalar `docs/` klasöründedir. Kenar çubuğu otomatik oluşturulur.
Site ayarları `docusaurus.config.ts` dosyasındadır.

Tailwind CSS 4 ve shadcn/ui (`base-nova`) kurulu. Tüm UI bileşenleri
`src/components/ui/` altında, tema değişkenleri `src/css/shadcn.css` içindedir.
`@/` yolu `src/` klasörünü gösterir. Kullanım örnekleri ve canlı demo,
`/RiskAtlas/ui-components/` sayfasındadır. Tooltip ve toast sağlayıcıları site
genelinde etkindir; koyu tema Docusaurus'un tema seçimini izler.

Yayın adresi: https://yagizerdem.github.io/RiskAtlas/

GitHub Pages için ilk yayından sonra depo ayarlarında **Settings → Pages →
Deploy from a branch → gh-pages → / (root)** seçilmelidir.
