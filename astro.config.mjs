// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://leelin98.github.io',
  base: '/mind-deck-project',
  integrations: [vue()],

  vite: {
    plugins: [tailwindcss()]
  }
});