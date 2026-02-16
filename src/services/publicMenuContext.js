const FALLBACK_PUBLIC_KEY = '';

export function resolvePublicKey(route) {
  const fromPath = route?.params?.publicKey;
  const fromQuery = route?.query?.publicKey || route?.query?.key;
  const fromStorage = localStorage.getItem('publicKey');
  const fromConfig = FALLBACK_PUBLIC_KEY;

  const resolved = [fromPath, fromQuery, fromStorage, fromConfig].find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  if (resolved) {
    localStorage.setItem('publicKey', resolved);
    return resolved;
  }

  return '';
}
