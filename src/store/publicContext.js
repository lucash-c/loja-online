const STORAGE_KEYS = {
  publicKey: 'publicKey',
  lojaKey: 'lojaKey',
};

const FALLBACK_VALUES = {
  publicKey: '',
  lojaKey: '',
};

const ENV_ALIASES = {
  publicKey: ['VITE_PUBLIC_KEY', 'VITE_MENU_PUBLIC_KEY'],
  lojaKey: ['VITE_LOJA_KEY', 'VITE_ORDER_LOJA_KEY'],
};

const QUERY_ALIASES = {
  publicKey: ['publicKey', 'key', 'menuKey', 'public_key', 'loja'],
  lojaKey: [
    'lojaKey',
    'orderKey',
    'xLojaKey',
    'loja',
    'public_key',
    'publicKey',
    'key',
    'menuKey',
  ],
};

const PARAM_ALIASES = {
  publicKey: ['publicKey'],
  lojaKey: ['lojaKey', 'publicKey'],
};

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getRouteFieldValue(routeField = {}, aliases = []) {
  for (const alias of aliases) {
    const value = normalizeValue(routeField?.[alias]);
    if (value) return value;
  }

  return '';
}

function getRouteValue(route, paramAliases = [], queryAliases = []) {
  if (!route) return '';

  const fromParams = getRouteFieldValue(route.params, paramAliases);
  if (fromParams) return fromParams;

  return getRouteFieldValue(route.query, queryAliases);
}

function getEnvValue(aliases = []) {
  for (const alias of aliases) {
    const value = normalizeValue(import.meta.env?.[alias]);
    if (value) return value;
  }

  return '';
}

function getStorageValue(storageKey) {
  return normalizeValue(localStorage.getItem(storageKey));
}

function persistValue(storageKey, value) {
  if (!value) return;
  localStorage.setItem(storageKey, value);
}

function resolveKey({ type, route, fallbackValue = '' }) {
  const routeValue = getRouteValue(
    route,
    PARAM_ALIASES[type] || [],
    QUERY_ALIASES[type] || []
  );
  const envValue = getEnvValue(ENV_ALIASES[type]);
  const storageValue = getStorageValue(STORAGE_KEYS[type]);
  const fallback = normalizeValue(fallbackValue || FALLBACK_VALUES[type]);

  const resolved = [routeValue, envValue, storageValue, fallback].find(Boolean) || '';

  if (resolved) {
    persistValue(STORAGE_KEYS[type], resolved);
  }

  return resolved;
}

export function resolvePublicKey(route, fallbackValue) {
  return resolveKey({ type: 'publicKey', route, fallbackValue });
}

export function resolveLojaKey(route, fallbackValue) {
  const publicKeyFallback = resolvePublicKey(route);
  return resolveKey({
    type: 'lojaKey',
    route,
    fallbackValue: fallbackValue || publicKeyFallback,
  });
}

export function hasPublicKey(route) {
  return Boolean(resolvePublicKey(route));
}

export function hasLojaKey(route) {
  return Boolean(resolveLojaKey(route));
}
