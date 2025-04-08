<template>
  <transition name="slide-up">
    <div v-if="modelValue" class="cart-bottom-sheet">
      <div class="cart-header bg-primary text-white">
        <span class="text-h6">🛒 Meu Carrinho</span>
        <q-btn
          flat
          icon="expand_more"
          color="white"
          @click="$emit('update:modelValue', false)"
        />
      </div>

      <q-list separator class="bg-white">
        <q-item
          v-for="(item, index) in cartStore.items"
          :key="index"
          class="cart-item"
        >
          <!-- Miniatura da imagem -->
          <q-item-section avatar>
            <q-img :src="item.imagem" class="img-mini" />
          </q-item-section>

          <!-- Nome e preço -->
          <q-item-section>
            <div class="text-bold">{{ item.nome }}</div>
            <div class="text-caption text-grey">
              {{ item.quantidade }}x R$ {{ Number(item.preco).toFixed(2) }} =
              <strong class="text-black">
                R$ {{ (item.quantidade * Number(item.preco)).toFixed(2) }}
              </strong>
            </div>
          </q-item-section>

          <!-- Botões de + e - -->
          <q-item-section side class="q-gutter-sm">
            <q-btn
              size="sm"
              round
              icon="remove"
              color="negative"
              @click="cartStore.decreaseQty(index)"
            />
            <q-btn
              size="sm"
              round
              icon="add"
              color="positive"
              @click="cartStore.increaseQty(index)"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Total do carrinho -->
      <div class="cart-total q-pa-md q-mt-sm">
        <q-separator />
        <div class="text-right text-h6 q-mt-sm">
          Total: <strong>R$ {{ totalCarrinho.toFixed(2) }}</strong>
        </div>
      </div>

      <!-- Campos do cliente -->
      <div class="q-pa-md">
        <q-input
          v-model="nome"
          label="Seu nome"
          outlined
          dense
          class="q-mb-sm"
          color="primary"
          :rules="[(val) => !!val || 'Informe seu nome']"
        />

        <q-input
          v-model="cep"
          label="CEP para entrega (opcional)"
          outlined
          dense
          color="primary"
        />

        <q-btn
          color="green"
          icon="whatsapp"
          label="Enviar Pedido pelo WhatsApp"
          class="full-width q-mt-md"
          :disable="!nome"
          @click="enviarPedidoWhatsApp"
        />
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from "vue";
import { useCartStore } from "src/store/cart";

defineProps(["modelValue"]);
defineEmits(["update:modelValue"]);

const cartStore = useCartStore();
const nome = ref("");
const cep = ref("");

const totalCarrinho = computed(() =>
  cartStore.items.reduce(
    (total, item) => total + item.quantidade * Number(item.preco),
    0
  )
);

function enviarPedidoWhatsApp() {
  const numero = "5519991414411";

  let mensagem = `*Pedido de ${nome.value}:*\n\n`;

  cartStore.items.forEach((item) => {
    mensagem += `• ${item.quantidade}x ${item.nome} [${item.codigo}] - R$ ${(
      Number(item.preco) * item.quantidade
    ).toFixed(2)}\n`;
  });

  mensagem += `\n*Total:* R$ ${totalCarrinho.value.toFixed(2)}\n`;

  if (cep.value) {
    mensagem += `\n*CEP para entrega:* ${cep.value}`;
  }

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
}

</script>

<style scoped>
.cart-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 80vh;
  background: #f9f9f9;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  overflow-y: auto;
}

@media (min-width: 1024px) {
  .cart-bottom-sheet {
    width: 50%;
    left: auto;
    right: 0;
    border-top-left-radius: 20px;
    border-top-right-radius: 0;
  }
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
}

.cart-total {
  border-top: 1px solid #eee;
  background-color: #fff;
  padding-bottom: 0;
}

.cart-item {
  background-color: #ffffff;
  border-radius: 10px;
  margin: 0.4rem 0.6rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.img-mini {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
