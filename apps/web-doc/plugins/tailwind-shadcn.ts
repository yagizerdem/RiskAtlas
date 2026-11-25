import path from 'node:path';
import tailwindPostcss from '@tailwindcss/postcss';
import type {LoadContext, Plugin} from '@docusaurus/types';

export default function tailwindShadcn(context: LoadContext): Plugin {
  return {
    name: 'tailwind-shadcn',
    configurePostCss(options) {
      // Tailwind's nested :is() selectors need to reach modern browsers intact.
      for (const plugin of options.plugins) {
        if (Array.isArray(plugin) && String(plugin[0]).includes('postcss-preset-env')) {
          plugin[1].features = {
            ...plugin[1].features,
            'is-pseudo-class': false,
            'cascade-layers': false,
          };
        }
      }
      options.plugins.push(tailwindPostcss({base: context.siteDir}));
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
}
