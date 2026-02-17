<template>
  <q-page class="q-pa-md">
    <q-banner
      v-if="contextError"
      class="bg-orange-1 text-orange-10 q-mb-md"
      rounded
    >
      {{ contextError }}
    </q-banner>

    <!-- Produtos agrupados -->
    <div
      v-for="(items, category) in groupedProducts"
      :key="category"
      :id="normalizeId(category)"
      class="q-mb-xl"
    >
      <div class="category-header">
        <q-icon name="label" color="primary" class="q-mr-sm" />
        <span class="category-title">{{ category }}</span>
        <div class="category-line" />
      </div>

      <div class="row q-col-gutter-md">
        <div
          class="col-12 col-md-4"
          v-for="(product, index) in items"
          :key="product.codigo || index"
        >
          <ProductCard :product="product" />
        </div>
      </div>
    </div>

    <!-- Banner quando não tem produtos -->
    <q-banner
      v-if="!contextError && Object.keys(groupedProducts).length === 0"
      class="bg-grey-2 text-grey-8 q-mt-xl"
    >
      Nenhum produto encontrado com "{{ searchTerm }}"
    </q-banner>

    <!-- Botão flutuante carrinho -->
    <q-btn
      color="primary"
      icon="shopping_cart"
      class="cart-fab"
      @click="cartOpen = true"
      :label="' R$ ' + totalPrice.toFixed(2)"
    >
      <q-badge v-if="cartStore.items.length" color="red" floating transparent>
        {{ cartStore.items.length }}
      </q-badge>
    </q-btn>

    <!-- Drawer do carrinho -->
    <CartDrawer v-model:isOpen="cartOpen" />

    <!-- Dialog de adicionais -->
    <AddonsDialog
      v-model:isOpen="addonsDialogOpen"
      :product="selectedProduct"
      :addons="filteredAddons"
      @confirm="addToCart"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide } from "vue";
import { getPublicMenu } from "src/services/menuApi";
import { resolvePublicKey, resolveLojaKey } from "src/store/publicContext";
import { useCartStore } from "src/store/cart";
import ProductCard from "src/components/ProductCard.vue";
import CartDrawer from "src/components/CartDrawer.vue";
import AddonsDialog from "src/components/AddonsDialog.vue";
import { normalizeId } from "src/utils/normalizeId";
import { useRoute } from "vue-router";

const route = useRoute();
const products = ref([]);
const addons = ref([]);
const cartOpen = ref(false);
const addonsDialogOpen = ref(false);
const selectedProduct = ref(null);
const cartStore = useCartStore();
const contextError = ref("");

// Busca via URL
const searchTerm = ref(route.query.search || "");
watch(
  () => route.query.search,
  (val) => (searchTerm.value = val)
);

// Filtra produtos pelo termo de busca
const activeProducts = computed(() =>
  products.value.filter((product) => product.is_active !== false)
);

const filteredProducts = computed(() => {
  if (!searchTerm.value) return activeProducts.value;
  const normalizedSearch = searchTerm.value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return activeProducts.value.filter((product) => {
    const name = (product.nome || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return name.includes(normalizedSearch);
  });
});

// Agrupa produtos por categoria
const groupedProducts = computed(() => {
  const groups = {};
  for (const product of filteredProducts.value) {
    const category = (product.categoria || "Outros")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    if (!groups[category]) groups[category] = [];
    groups[category].push(product);
  }
  return groups;
});

// Filtra addons da categoria do produto selecionado
const filteredAddons = computed(() => {
  if (!selectedProduct.value) return [];
  const productCategory = (selectedProduct.value.categoria || "Outros")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  return addons.value.filter((addon) => {
    if (addon.is_active === false) return false;
    const addonCategory = (addon.categoria || "Outros")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    return addonCategory === productCategory;
  });
});

// Carrega produtos e addons
onMounted(async () => {
  const publicKey = resolvePublicKey(route);
  const lojaKey = resolveLojaKey(route);

  if (!publicKey) {
    contextError.value =
      "Não encontramos a chave pública do cardápio. Verifique o link recebido da loja.";
    return;
  }

  if (!lojaKey) {
    contextError.value =
      "Cardápio carregado, mas a chave de pedido não foi encontrada. Você poderá navegar, mas não enviar pedidos.";
  }

  try {
    const menu = await getPublicMenu(publicKey);

    products.value = (menu.products || []).filter((product) => product.is_active !== false);
    addons.value = (menu.addons || []).filter((addon) => addon.is_active !== false);

    if (menu.loja) {
      localStorage.setItem("loja", JSON.stringify(menu.loja));
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    if (!contextError.value) {
      contextError.value = "Não foi possível carregar o cardápio agora. Tente novamente em instantes.";
    }
  }
});

// Função para abrir dialog de adicionais
function openAddonsDialogFn(product) {
  selectedProduct.value = product;

  const productCategory = (product.categoria || "Outros")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  const categoryAddons = addons.value.filter((addon) => {
    if (addon.is_active === false) return false;
    const addonCategory = (addon.categoria || "Outros")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    return addonCategory === productCategory;
  });

  if (!product.has_options || categoryAddons.length === 0) {
    cartStore.addItem(product);
    animateCart();
    return;
  }

  addonsDialogOpen.value = true;
}

// Injeta função para ProductCard abrir dialog
provide("openAddonsDialog", openAddonsDialogFn);

// Adiciona produto ao carrinho
function addToCart({ product, addons }) {
  cartStore.addItem(product, addons);
  animateCart();
}

// Animação do botão do carrinho
function animateCart() {
  const el = document.querySelector(".cart-fab");
  if (el) {
    el.classList.add("animate-bounce");
    setTimeout(() => el.classList.remove("animate-bounce"), 500);
  }
}

// Preço total do carrinho
const totalPrice = computed(() =>
  cartStore.items.reduce((total, item) => {
    return total + cartStore.itemSubtotal(item);
  }, 0)
);
</script>

<style scoped>
.cart-fab {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1100;
  padding: 10px;
  transition: transform 0.3s;
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
}

.category-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #333;
}

.category-line {
  flex-grow: 1;
  height: 2px;
  background: #eee;
  margin-left: 12px;
  border-radius: 2px;
}

.animate-bounce {
  animation: bounce 0.5s;
}

@keyframes bounce {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>
