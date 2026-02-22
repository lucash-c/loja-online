import {
  normalizeOption,
  normalizeOptionItem,
  normalizeProduct,
} from "src/utils/menuNormalizer";
import { API_URLS } from "src/config/api";

const MENU_API_BASE_URL = API_URLS.backend;
const MENU_CACHE_KEY = "publicMenu";

function buildMenuUrl(publicKey) {
  const normalizedKey = String(publicKey || "").trim();
  if (!normalizedKey) {
    throw new Error("Chave pública da loja não informada.");
  }

  const path = `/public/menu/${encodeURIComponent(normalizedKey)}`;
  return `${MENU_API_BASE_URL}${path}`;
}

function readCachedMenu() {
  const cached = localStorage.getItem(MENU_CACHE_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    localStorage.removeItem(MENU_CACHE_KEY);
    return null;
  }
}

function saveCachedMenu(menu) {
  localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(menu));
}

async function parseResponsePayload(response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const details =
      payload?.message || payload?.error || `HTTP ${response.status}`;
    throw new Error(`Falha ao carregar cardápio público: ${details}`);
  }

  return payload;
}

function normalizeMenuPayload(payload) {
  const root = payload?.data || payload || {};

  const productsRaw = root.products || root.produtos || root.items || [];
  const categoriesRaw = root.categories || root.categorias || [];
  const addonsRaw = root.addons || root.adicionais || root.options || [];
  const loja = root.store || root.loja || null;
  const entregaConfig =
    root.delivery_config ||
    root.deliveryConfig ||
    root.entrega_config ||
    root.entrega ||
    root.delivery_ranges ||
    [];
  const formasPagamento =
    root.payment_methods ||
    root.paymentMethods ||
    root.formas_pagamento ||
    root.pagamento ||
    [];

  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const categoryById = new Map(
    categories
      .filter((category) => category && category.id !== undefined)
      .map((category) => [String(category.id), category])
  );

  const productsFromCategories = categories.flatMap((category) => {
    const categoryProducts = Array.isArray(category?.products)
      ? category.products
      : [];

    return categoryProducts.map((product) => ({
      ...product,
      category_id: product?.category_id ?? category?.id ?? null,
      category: product?.category || category,
      category_name: product?.category_name || product?.category?.name || category?.name,
      categoria: product?.categoria || product?.category_name || product?.category?.name || category?.name,
    }));
  });

  const sourceProducts =
    Array.isArray(productsRaw) && productsRaw.length > 0
      ? productsRaw
      : productsFromCategories;

  const products = Array.isArray(sourceProducts)
    ? sourceProducts.map((product) => {
        const categoryId = product?.category_id ?? product?.category?.id;
        const fallbackCategory =
          categoryId !== undefined && categoryId !== null
            ? categoryById.get(String(categoryId))
            : null;

        return normalizeProduct({
          ...product,
          category: product?.category || fallbackCategory || null,
          category_name:
            product?.category_name ||
            product?.category?.name ||
            fallbackCategory?.name ||
            null,
          categoria:
            product?.categoria ||
            product?.category_name ||
            product?.category?.name ||
            fallbackCategory?.name ||
            'Outros',
        });
      })
    : [];

  const addons = Array.isArray(addonsRaw)
    ? addonsRaw.map((addon) =>
        Array.isArray(addon?.items) || Array.isArray(addon?.itens)
          ? normalizeOption(addon)
          : normalizeOptionItem(addon)
      )
    : [];

  return {
    products,
    addons,
    loja,
    entregaConfig: Array.isArray(entregaConfig)
      ? entregaConfig
      : [entregaConfig].filter(Boolean),
    formasPagamento: Array.isArray(formasPagamento)
      ? formasPagamento
      : [formasPagamento].filter(Boolean),
    raw: payload,
  };
}

export async function getPublicMenu(publicKey) {
  const url = buildMenuUrl(publicKey);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    const payload = await parseResponsePayload(response);
    const normalized = normalizeMenuPayload(payload);
    saveCachedMenu(normalized);

    if (normalized.loja) {
      localStorage.setItem("loja", JSON.stringify(normalized.loja));
    }

    return normalized;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Erro de rede ao carregar cardápio público. Verifique sua conexão."
      );
    }

    throw error;
  }
}

async function getMenuFromCacheOrApi(publicKey) {
  const cached = readCachedMenu();
  if (cached) return cached;
  return getPublicMenu(publicKey);
}

// Adapters temporários para compatibilidade com fluxo legado.
export async function getProducts(publicKey) {
  const menu = await getMenuFromCacheOrApi(publicKey);
  return menu.products || [];
}

export async function getAddons(publicKey) {
  const menu = await getMenuFromCacheOrApi(publicKey);
  return menu.addons || [];
}

export async function getLoja(publicKey) {
  const menu = await getMenuFromCacheOrApi(publicKey);
  return menu.loja ? [menu.loja] : [];
}

export async function getEntregaConfig(publicKey) {
  const menu = await getMenuFromCacheOrApi(publicKey);
  return menu.entregaConfig || [];
}

export async function getFormasPagamento(publicKey) {
  const menu = await getMenuFromCacheOrApi(publicKey);
  return menu.formasPagamento || [];
}
