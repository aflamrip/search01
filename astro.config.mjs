import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: [
        'node:async_hooks',
        'node:crypto',
        'node:path',
        'node:url',
        'node:fs/promises',
      ],
    },
  },
});
