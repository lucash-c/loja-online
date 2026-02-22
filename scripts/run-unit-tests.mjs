import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

await mkdir('tests/.tmp', { recursive: true });

process.env.VITE_BACKEND_API_URL ??= 'http://localhost';
process.env.VITE_PAYMENT_API_URL ??= 'http://localhost';
process.env.VITE_IMAGE_HOST_API_URL ??= 'http://localhost';
process.env.VITE_DISTANCE_API_URL ??= 'http://localhost';

const testEntryPoints = ['helpers.test', 'publicOptionSelection.test', 'routes.test'];

for (const testEntryPoint of testEntryPoints) {
  await build({
    entryPoints: [`tests/unit/${testEntryPoint}.js`],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: `tests/.tmp/${testEntryPoint}.bundle.mjs`,
    sourcemap: 'inline',
    logLevel: 'silent',
    define: {
      'import.meta.env': '{}',
      'import.meta.env.VITE_ORDER_API_BASE_URL': '""',
      'import.meta.env.VITE_BACKEND_API_URL': '"http://localhost"',
      'import.meta.env.VITE_PAYMENT_API_URL': '"http://localhost"',
      'import.meta.env.VITE_IMAGE_HOST_API_URL': '"http://localhost"',
      'import.meta.env.VITE_DISTANCE_API_URL': '"http://localhost"',
    },
    loader: {
      '.vue': 'text',
    },
  });

  await import(pathToFileURL(`tests/.tmp/${testEntryPoint}.bundle.mjs`).href);
}
