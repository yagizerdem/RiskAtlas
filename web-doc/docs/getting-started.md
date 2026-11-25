---
sidebar_position: 2
title: Dokümantasyon geliştirme
---

## Kurulum

Node.js 20 veya üzeri ve npm gereklidir. Komutları depo kökünden başlatın:

```bash
cd web-doc
npm ci
npm start
```

Geliştirme sunucusu siteyi `http://localhost:3000/RiskAtlas/` adresinde açar.
Markdown dosyalarını değiştirdiğinizde sayfa otomatik güncellenir.

Ana uygulamalar pnpm kullanır. Dokümantasyonun npm bağımlılıkları ve
`package-lock.json` dosyası bu klasörde tutulur.

## Yeni sayfa ekleme

`docs` klasörüne bir Markdown dosyası ekleyin:

```markdown
---
sidebar_position: 4
title: Yeni sayfa
---

Sayfa içeriği buraya yazılır.
```

Kenar çubuğu `sidebars.js` içindeki otomatik yapılandırma ile oluşturulur.
Başlık, gezinme bağlantıları ve site adresi `docusaurus.config.js` dosyasında;
renkler ise `src/css/custom.css` dosyasında düzenlenir.

## Üretim derlemesi

```bash
npm run build
npm run serve
```

Statik site `build` klasörüne oluşturulur. Önizleme adresi
`http://localhost:3000/RiskAtlas/` olur.
