import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.apurvamehta.com',
  integrations: [mdx(), sitemap()],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Crimson Pro',
      cssVariable: '--font-crimson-pro',
      weights: ['400', '600'],
      styles: ['normal', 'italic'],
      display: 'swap',
      fallbacks: ['Palatino', 'Palatino Linotype', 'Book Antiqua', 'Georgia', 'serif'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
