---
sidebar_position: 3
title: GitHub Pages yayını
---

Site, `yagizerdem/RiskAtlas` deposu için yapılandırılmıştır.
Yayın adresi: [yagizerdem.github.io/RiskAtlas](https://yagizerdem.github.io/RiskAtlas/).
Bu adres, ilk başarılı yayın ve GitHub Pages etkinleştirmesinden sonra kullanılabilir.

## Yayınlama

Git kurulu ve GitHub deposuna push yetkiniz olmalıdır.
`web-doc` klasöründe çalıştırın:

```bash
npm run deploy
```

`predeploy` komutu önce üretim derlemesini oluşturur. Ardından `gh-pages`,
`build` klasörünü uzak depodaki `gh-pages` dalına gönderir ve `.nojekyll`
dosyasını ekler.

İlk yayından sonra GitHub deposunda **Settings → Pages** bölümüne gidin:

1. **Source:** Deploy from a branch
2. **Branch:** gh-pages
3. **Folder:** / (root)

## Farklı depo kullanma

`docusaurus.config.js` dosyasındaki `url`, `baseUrl`, `organizationName`,
`projectName` ve GitHub bağlantılarını güncelleyin. `gh-pages` varsayılan olarak
Git deposunun `origin` uzak adresine yayın yapar.

Kurulum tek başına yayın yapmaz; yayın için `npm run deploy` komutunu çalıştırın.

## Kaynaklar

- [Docusaurus kurulum rehberi](https://docusaurus.io/docs/installation)
- [Docusaurus yayınlama rehberi](https://docusaurus.io/docs/deployment)
- [gh-pages paketi](https://github.com/tschaub/gh-pages)
