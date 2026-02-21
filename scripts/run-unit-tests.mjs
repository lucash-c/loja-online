import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

await mkdir('tests/.tmp', { recursive: true });

const testEntryPoints = ['helpers.test', 'routes.test'];

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
    },
    loader: {
      '.vue': 'text',
    },
  });

  await import(pathToFileURL(`tests/.tmp/${testEntryPoint}.bundle.mjs`).href);
}
