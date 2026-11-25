const path = require('node:path');

module.exports = function tailwindShadcn(context) {
  return {
    name: 'tailwind-shadcn',
    configurePostCss(options) {
      // Tailwind's nested :is() selectors need to reach modern browsers intact.
      for (const plugin of options.plugins) {
        if (Array.isArray(plugin) && plugin[0].includes('postcss-preset-env')) {
          plugin[1].features = {...plugin[1].features, 'is-pseudo-class': false};
        }
      }
      options.plugins.push(require('@tailwindcss/postcss')({base: context.siteDir}));
      return options;
    },
    configureWebpack() {
      return {
        resolve: {
          alias: {'@': path.resolve(context.siteDir, 'src')},
        },
      };
    },
  };
};
