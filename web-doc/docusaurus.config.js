/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'RiskAtlas Dokümantasyon',
  tagline: 'RiskAtlas proje ve geliştirici dokümantasyonu',
  url: 'https://yagizerdem.github.io',
  baseUrl: '/RiskAtlas/',
  organizationName: 'yagizerdem',
  projectName: 'RiskAtlas',
  deploymentBranch: 'gh-pages',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  plugins: ['./plugins/tailwind-shadcn.cjs'],
  future: {
    faster: {
      lightningCssMinimizer: true,
    },
  },
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/yagizerdem/RiskAtlas/edit/main/web-doc/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'RiskAtlas',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          label: 'Dokümantasyon',
          position: 'left',
        },
        {
          href: 'https://github.com/yagizerdem/RiskAtlas',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `© ${new Date().getFullYear()} RiskAtlas. Docusaurus ile oluşturuldu.`,
    },
  },
};

module.exports = config;
