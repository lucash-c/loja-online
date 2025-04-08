<template>
  <q-card class="product-card">
    <!-- Imagem do produto -->
    <q-img
      :src="imageSrc"
      class="product-img"
      @error="handleImageError"
    />

    <!-- Informações do produto -->
    <q-card-section class="q-pt-sm q-pb-none">
      <div class="product-name">{{ product.nome }}</div>
      <div class="product-price">
        R$ {{ Number(product.preco).toFixed(2) }}
      </div>
      <div v-if="product.descricao" class="product-description">
        {{ product.descricao }}
      </div>
    </q-card-section>

    <!-- Botão de ação -->
    <q-card-actions align="right" class="q-pa-sm">
      <q-btn
        icon="add_shopping_cart"
        label="Adicionar"
        color="primary"
        flat
        no-caps
        class="add-btn"
        @click="$emit('add-to-cart', product)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ product: Object })
const imageSrc = ref(props.product.imagem)

function handleImageError() {
  imageSrc.value =
    'https://via.placeholder.com/300x225?text=Imagem+N%C3%A3o+Dispon%C3%ADvel'
}
</script>

<style scoped>
.product-card {
  border-radius: 16px;
  overflow: hidden;
  transition: box-shadow 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.product-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.product-img {
  height: 200px;
  object-fit: cover;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.product-price {
  font-size: 1rem;
  color: #00796b;
  font-weight: 500;
  margin-bottom: 6px;
}

.product-description {
  font-size: 0.85rem;
  color: #666;
  line-height: 1.3;
}

.add-btn {
  transition: transform 0.2s ease;
}

.add-btn:hover {
  transform: scale(1.05);
}
</style>
