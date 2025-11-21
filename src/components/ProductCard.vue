<template>
  <q-card class="q-ma-sm q-pa-sm">
    <q-card-section class="row items-center no-wrap">
      <!-- Imagem -->
      <q-img
        :src="getImageSrc(product.imagem)"
        :alt="product.nome"
        width="120px"
        height="120px"
        class="q-mr-md"
      />

      <!-- Informações do produto -->
      <div>
        <div class="product-name">{{ product.nome }}</div>
        <div class="product-description">
          {{ product.descricao }}
        </div>
        <div class="product-price">
          R$ {{ Number(product.preco).toFixed(2) }}
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn color="primary" label="Adicionar" @click="handleAddClick" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { inject } from "vue";
import { getImageSrc } from "../utils/image";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

// Função injetada do IndexPage para abrir o dialog de adicionais
const openAddonsDialog = inject("openAddonsDialog");

function handleAddClick() {
  if (openAddonsDialog) {
    openAddonsDialog(props.product);
    console.log(props.product.imagem);
  } else {
    console.error("Função openAddonsDialog não encontrada!");
  }
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
