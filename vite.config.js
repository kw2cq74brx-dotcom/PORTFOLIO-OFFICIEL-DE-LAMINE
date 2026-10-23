import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import site from './site.config.js';

const root = fileURLToPath(new URL('.', import.meta.url));

// Chaque fichier .html à la racine devient une page du site
const pages = readdirSync(root).filter((file) => file.endsWith('.html'));

// Mini-moteur de gabarits :
//   <include src="partials/header.html"></include> → contenu du fichier
//   {{ email }}                                    → valeur de site.config.js
function htmlTemplate(data) {
  const include = (html, depth = 0) =>
    html.replace(/<include src="([^"]+)"\s*><\/include>/g, (_, src) => {
      if (depth > 5) throw new Error(`Inclusion trop profonde : ${src}`);
      return include(readFileSync(resolve(root, src), 'utf-8'), depth + 1);
    });

  const fill = (html) =>
    html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      if (!(key in data)) throw new Error(`site.config.js : la clé « ${key} » n'existe pas`);
      return data[key];
    });

  return {
    name: 'html-template',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => fill(include(html)),
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('/partials/')) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [htmlTemplate(site), tailwindcss()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(pages.map((page) => [page.replace('.html', ''), resolve(root, page)])),
    },
  },
});
