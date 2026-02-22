import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { getProducts } from "src/services/menuApi";
import { resolvePublicKey } from "src/services/publicMenuContext";

function normalizeCategoryLabel(value) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

export function resolveProductCategory(product = {}) {
  const categoryObjectName =
    typeof product?.category === "object" && product?.category !== null
      ? product.category.name
      : "";

  const rawCategory =
    product?.categoria ||
    product?.category_name ||
    categoryObjectName ||
    (typeof product?.category === "string" ? product.category : "");

  return normalizeCategoryLabel(rawCategory) || "OUTROS";
}

export function groupProductsByCategory(products = []) {
  return products.reduce((groups, product) => {
    const category = resolveProductCategory(product);

    if (!groups[category]) groups[category] = [];
    groups[category].push(product);

    return groups;
  }, {});
}

export const useProductStore = defineStore("products", () => {
  const products = ref([]);

  async function loadProducts(route) {
    try {
      const publicKey = resolvePublicKey(route);
      products.value = await getProducts(publicKey);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  }

  const groupedProducts = computed(() => {
    return groupProductsByCategory(products.value);
  });

  return {
    products,
    groupedProducts,
    loadProducts,
  };
});
