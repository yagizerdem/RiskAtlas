import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'RiskAtlas Dokümantasyon',
  tagline: 'RiskAtlas proje ve geliştirici dokümantasyonu',
  url: 'https://yagizerdem.github.io',
  baseUrl: '/RiskAtlas/',
  organizationName: 'yagizerdem',
  projectName: 'RiskAtlas',
  deploymentBranch: 'gh-pages',
  trailingSlash: true,
  onBrokenLinks: 'throw',
  plugins: ['./plugins/tailwind-shadcn.ts'],
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
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/yagizerdem/RiskAtlas/edit/main/apps/web-doc/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
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
  } satisfies Preset.ThemeConfig,
};

export default config;
