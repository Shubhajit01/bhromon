import { tanstackStart } from '@tanstack/react-start/plugin/vite';

import { cloudflare } from '@cloudflare/vite-plugin';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import agents from 'agents/vite';
import { defineConfig } from 'vite';
import { imagetools } from 'vite-imagetools';

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    agents(),
    tailwindcss(),
    tanstackStart(),
    babel({ presets: [reactCompilerPreset()] }),
    viteReact(),
    imagetools(),
  ],
});

export default config;
