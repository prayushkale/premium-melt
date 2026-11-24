import { defineConfig } from 'cf/config';

export default defineConfig({
  worker: {
    name: 'premium-melt',
    compatibilityDate: '2026-11-24',
    observability: {
      enabled: true,
    },
    assets: {
      notFoundHandling: 'single-page-application',
    },
  },
});
