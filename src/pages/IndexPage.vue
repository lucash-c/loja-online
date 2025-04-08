<template>
  <q-page class="q-pa-md">
    <div
      v-for="(items, category) in groupedProducts"
      :key="category"
      class="q-mb-xl"
    >
      <!-- Título estilizado da categoria -->
      <div class="category-header">
        <q-icon name="label" color="primary" class="q-mr-sm" />
        <span class="category-title">{{ category }}</span>
        <div class="category-line" />
      </div>

      <div class="row q-col-gutter-md">
        <div
          class="col-12 col-md-4"
          v-for="(product, index) in items"
          :key="index"
        >
          <ProductCard :product="product" @add-to-cart="addToCart" />
        </div>
      </div>
    </div>

    <!-- Botão flutuante do carrinho com animação e valor total -->
    <q-btn
      color="primary"
      class="cart-fab"
      @click="cartOpen = true"
      :label="' 🛒 R$ ' + totalPrice.toFixed(2)"
    >
      <q-badge v-if="cartStore.items.length" color="red" floating transparent>
        {{ cartStore.items.length }}
      </q-badge>
    </q-btn>

    <CartDrawer
      :model-value="cartOpen"
      @update:modelValue="cartOpen = $event"
    />
  </q-page>
</template>


<script setup>
import { ref, computed, onMounted } from "vue";
import { getProducts } from "src/services/sheetApi";
import { useCartStore } from "src/store/cart";
import ProductCard from "src/components/ProductCard.vue";
import CartDrawer from "src/components/CartDrawer.vue";

const products = ref([]);
const cartOpen = ref(false);
const cartStore = useCartStore();

const totalPrice = computed(() =>
  cartStore.items.reduce(
    (total, item) => total + Number(item.preco) * item.quantidade,
    0
  )
);

const groupedProducts = computed(() => {
  const groups = {};
  for (const product of products.value) {
    const rawCategory = product.categoria || "Outros";
    const category = rawCategory.toUpperCase();
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
  }
  return groups;
});

onMounted(async () => {
  products.value = await getProducts();
  console.log(products);
});

function addToCart(product) {
  cartStore.addItem(product);
  animateCart();
}

function animateCart() {
  const el = document.querySelector(".cart-fab");
  if (el) {
    el.classList.add("animate-bounce");
    setTimeout(() => el.classList.remove("animate-bounce"), 500);
  }
}
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
