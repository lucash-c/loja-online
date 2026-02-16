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
  publicKey: ['publicKey', 'key', 'menuKey'],
  lojaKey: ['lojaKey', 'orderKey', 'xLojaKey'],
};

function normalizeValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getRouteValue(route, aliases = []) {
  if (!route) return '';

  for (const alias of aliases) {
    const fromQuery = normalizeValue(route?.query?.[alias]);
    if (fromQuery) return fromQuery;

    const fromParams = normalizeValue(route?.params?.[alias]);
    if (fromParams) return fromParams;
  }

  return '';
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
  const routeValue = getRouteValue(route, QUERY_ALIASES[type]);
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
  return resolveKey({ type: 'lojaKey', route, fallbackValue });
}

export function hasPublicKey(route) {
  return Boolean(resolvePublicKey(route));
}

export function hasLojaKey(route) {
  return Boolean(resolveLojaKey(route));
}
