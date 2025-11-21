import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getProducts } from 'src/services/sheetApi';

export const useProductStore = defineStore('products', () => {
  const products = ref([]);

  async function loadProducts() {
    try {
      products.value = await getProducts();
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  }

  const groupedProducts = computed(() => {
    const groups = {};
    for (const product of products.value) {
      const rawCategory = product.categoria || 'Outros';
      const category = rawCategory
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();

      if (!groups[category]) groups[category] = [];
      groups[category].push(product);
    }
    return groups;
  });

  return {
    products,
    groupedProducts,
    loadProducts,
  };
});
