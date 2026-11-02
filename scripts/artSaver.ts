// Dev-server endpoint for tools/art.html: POST /__art/<name>.png saves the drawn icon / splash into assets/.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const assetsDir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'assets');
const SAFE_NAME = /^\/__art\/([\w-]+\.png)$/;

export function artSaver(): Plugin {
  return {
    name: 'art-saver',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const match = request.method === 'POST' ? SAFE_NAME.exec(request.url ?? '') : null;
        if (!match) { next(); return; }
        const chunks: Buffer[] = [];
        request.on('data', (chunk: Buffer) => chunks.push(chunk));
        request.on('end', () => {
          mkdirSync(assetsDir, { recursive: true });
          writeFileSync(join(assetsDir, match[1]), Buffer.concat(chunks));
          response.statusCode = 204; response.end();
        });
      });
    },
  };
}
