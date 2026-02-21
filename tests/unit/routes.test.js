import assert from 'node:assert/strict';
import routes from '../../src/router/routes.js';

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const legacyPublicKeyRoute = routes.find((route) => route.path === '/:publicKey');

test('legacy route /:publicKey redireciona para /r/:publicKey mantendo query', () => {
  const redirectResult = legacyPublicKeyRoute.redirect({
    params: { publicKey: '871b52b21d76836dd3cf443edd5093e3' },
    query: { utm_source: 'instagram' },
  });

  assert.deepEqual(redirectResult, {
    path: '/r/871b52b21d76836dd3cf443edd5093e3',
    query: { utm_source: 'instagram' },
    replace: true,
  });
});

test('legacy route /:publicKey evita colisão com /r', () => {
  const redirectResult = legacyPublicKeyRoute.redirect({
    params: { publicKey: 'r' },
    query: {},
  });

  assert.deepEqual(redirectResult, {
    path: '/',
    query: {},
    replace: true,
  });
});
