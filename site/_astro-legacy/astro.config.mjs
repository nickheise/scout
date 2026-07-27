// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import { SITE } from './src/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [react()],

  security: {
    /**
     * Astro's stable CSP support (meta-tag based). Astro emits `script-src`
     * and `style-src` with per-asset hashes automatically; allowances beyond
     * that are kept minimal:
     *
     * - `style-src-attr 'unsafe-inline'`: the page uses a handful of inline
     *   `style` attributes (the Demo section's scene-break font + report
     *   color, and React-SSR'd style props in the TerminalDemo island).
     *   Hashed style-src ignores 'unsafe-inline' in the default directive,
     *   so the attribute-scoped directive is required for those to apply.
     *   Style attributes only — no inline <style>/<script> is loosened.
     *
     * - GoatCounter (`https://gc.zgo.at`): script-src allowance added ONLY
     *   when analytics are actually wired up (SITE.goatcounter set), same
     *   gate as the script tag in Layout.astro and the footer disclosure.
     *   The counter beacon itself is an image/beacon GET; Astro sets no
     *   default-src/img-src/connect-src, so no further allowance is needed.
     */
    csp: {
      styleDirective: {
        resources: [
          "'self'",
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
      scriptDirective: {
        resources: [
          "'self'",
          ...(SITE.goatcounter ? ['https://gc.zgo.at'] : []),
        ],
      },
    },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
