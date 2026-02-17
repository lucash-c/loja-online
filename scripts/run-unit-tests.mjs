import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

await mkdir('tests/.tmp', { recursive: true });

await build({
  entryPoints: ['tests/unit/helpers.test.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'tests/.tmp/helpers.test.bundle.mjs',
  sourcemap: 'inline',
  logLevel: 'silent',
  define: {
    'import.meta.env': '{}',
    'import.meta.env.VITE_ORDER_API_BASE_URL': '""',
  },
});

await import(pathToFileURL('tests/.tmp/helpers.test.bundle.mjs').href);
