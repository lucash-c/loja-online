import { resolveLojaKey } from 'src/store/publicContext';

const ORDER_API_BASE_URL = (import.meta.env.VITE_ORDER_API_BASE_URL || '').replace(/\/$/, '');

function buildOrdersUrl() {
  return ORDER_API_BASE_URL ? `${ORDER_API_BASE_URL}/api/orders` : '/api/orders';
}

export function getLojaKeyOrThrow(route) {
  const lojaKey = resolveLojaKey(route);
  if (!lojaKey) {
    throw new Error('Não encontramos a chave da loja para enviar seu pedido.');
  }

  return lojaKey;
}

export async function createPublicOrder(payload, lojaKey, idempotencyKey) {
  if (!lojaKey) {
    throw new Error('Não encontramos a chave da loja para enviar seu pedido.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-LOJA-KEY': lojaKey,
  };

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const controller = new AbortController();
  const timeoutMs = 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const bodyPayload = idempotencyKey
    ? { ...payload, idempotency_key: idempotencyKey }
    : payload;

  let response;
  try {
    response = await fetch(buildOrdersUrl(), {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('TIMEOUT_ERROR');
      timeoutError.code = 'TIMEOUT_ERROR';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const details = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(`Falha ao enviar pedido: ${details}`);
  }

  return data;
}
