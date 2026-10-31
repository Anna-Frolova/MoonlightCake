import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` produces one self-contained dist/index.html
// (it opens with a double click and can be published as an Artifact).
export default defineConfig({
  plugins: [viteSingleFile()],
  server: { port: 8765, open: false },
  build: { target: 'es2022' },
  define: { __BUILD_ID__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')) },
});
