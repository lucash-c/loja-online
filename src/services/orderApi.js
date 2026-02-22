import { API_URLS } from "src/config/api";
import { resolveLojaKey } from "src/store/publicContext";

const ORDER_API_BASE_URL = API_URLS.backend;
const ALLOWED_ORDER_TYPES = ["entrega", "retirada", "local"];

function buildOrdersUrl() {
  return `${ORDER_API_BASE_URL}/api/orders`;
}

export function getLojaKeyOrThrow(route) {
  const lojaKey = resolveLojaKey(route);
  if (!lojaKey) {
    throw new Error("Não encontramos a chave da loja para enviar seu pedido.");
  }

  return lojaKey;
}

export function normalizeOrderType(orderType) {
  const normalizedOrderType = String(orderType || "")
    .trim()
    .toLowerCase();

  if (!ALLOWED_ORDER_TYPES.includes(normalizedOrderType)) {
    throw new Error(
      "Tipo de pedido inválido. Use: entrega, retirada ou local."
    );
  }

  return normalizedOrderType;
}

export async function createPublicOrder(payload, lojaKey, idempotencyKey) {
  if (!lojaKey) {
    throw new Error("Não encontramos a chave da loja para enviar seu pedido.");
  }

  const headers = {
    "Content-Type": "application/json",
    "X-LOJA-KEY": lojaKey,
  };

  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const controller = new AbortController();
  const timeoutMs = 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const normalizedPayload = {
    ...payload,
    order_type: normalizeOrderType(payload?.order_type),
  };

  const bodyPayload = idempotencyKey
    ? { ...normalizedPayload, idempotency_key: idempotencyKey }
    : normalizedPayload;

  let response;
  try {
    response = await fetch(buildOrdersUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("TIMEOUT_ERROR");
      timeoutError.code = "TIMEOUT_ERROR";
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
