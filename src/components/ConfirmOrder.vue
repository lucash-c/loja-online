<template>
  <q-dialog v-model="isOpenProxy" persistent>
    <q-card style="min-width: 360px; max-width: 480px">
      <!-- Cabeçalho -->
      <q-toolbar class="q-pa-none q-mb-xs bg-primary text-white">
        <q-toolbar-title class="text-h6 text-center" style="flex: 1">
          <q-icon name="receipt_long" class="q-mr-sm" /> Resumo do Pedido
        </q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="white"
          @click="handleClose"
        />
      </q-toolbar>

      <q-card-section class="q-gutter-md">
        <!-- Cliente -->
        <div class="row items-center q-mb-sm">
          <q-icon name="person" class="q-mr-sm" color="primary" size="26px" />
          <strong>Cliente: </strong> {{ orderData.nome }}
        </div>

        <!-- Endereço ou mesa -->
        <div
          v-if="selectedOrderType === 'entrega'"
          class="row items-center q-mb-sm"
        >
          <q-icon name="home" class="q-mr-sm" color="primary" size="26px" />
          <strong>Endereço: </strong>
          {{ endereco.logradouro }}, {{ orderData.numero }} -
          {{ endereco.bairro }}, {{ endereco.localidade }}
        </div>

        <div
          v-else-if="selectedOrderType === 'loja'"
          class="row items-center q-mb-sm"
        >
          <q-icon
            name="table_restaurant"
            class="q-mr-sm"
            color="primary"
            size="26px"
          />
          <strong>Mesa: </strong> {{ orderData.mesa }}
        </div>

        <!-- Frete -->
        <div
          v-if="selectedOrderType === 'entrega'"
          class="row items-center q-mb-sm"
        >
          <q-icon
            name="two_wheeler"
            class="q-mr-sm"
            color="primary"
            size="26px"
          />
          <strong>Frete: </strong> R$ {{ Number(frete).toFixed(2) }}
        </div>

        <!-- Tempo de espera -->
        <div v-if="tempoEntrega" class="row items-center q-mb-sm">
          <q-icon name="schedule" class="q-mr-sm" color="primary" size="26px" />
          <strong>Tempo de espera: </strong> {{ tempoEntrega }}
        </div>

        <!-- Itens do pedido -->
        <div>
          <strong>Itens: </strong>
          <div
            v-for="item in cart.items"
            :key="item.codigo + JSON.stringify(item.addons)"
            class="q-mb-sm"
          >
            <q-card flat bordered class="q-pa-sm bg-grey-1">
              <div class="row items-center">
                <q-badge color="primary" text-color="white" class="q-mr-sm">
                  x{{ item.quantidade }}
                </q-badge>
                <span class="text-weight-medium">{{ item.nome }}</span>
                <span class="q-ml-auto text-subtitle2"
                  >R$ {{ itemSubtotal(item).toFixed(2) }}</span
                >
              </div>
              <div
                v-if="item.addons && item.addons.length"
                class="q-mt-xs q-ml-md"
              >
                <q-chip
                  v-for="addon in item.addons"
                  :key="addon.codigo"
                  outline
                  dense
                  color="secondary"
                  text-color="white"
                  class="q-mr-xs q-mb-xs"
                  :label="`${addon.nome} - R$ ${Number(addon.preco).toFixed(
                    2
                  )}`"
                />
              </div>
            </q-card>
          </div>
        </div>

        <!-- Total -->
        <div class="text-h6 text-right q-mt-md">
          <q-icon name="attach_money" class="q-mr-sm" color="primary" />
          <strong>Total: R$ {{ cartTotal.toFixed(2) }}</strong>
        </div>

        <!-- Método de pagamento -->
        <div v-if="metodoPagamento" class="row items-center q-mt-sm">
          <q-icon name="payments" class="q-mr-sm" color="primary" size="26px" />
          <strong>Método de Pagamento: </strong>
          <span class="q-ml-xs">{{ metodoPagamento }}</span>
        </div>
      </q-card-section>

      <q-card-actions align="around">
        <q-btn flat label="Voltar" color="grey" @click="handleClose" />
        <q-btn color="primary" label="Prosseguir" @click="handleProceed" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { useCartStore } from "src/store/cart";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  orderData: { type: Object, required: true },
  selectedOrderType: { type: String, required: true },
  endereco: { type: Object, default: () => ({}) },
  frete: { type: [Number, String], default: 0 },
  tempoEntrega: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "close", "proceed"]);

const isOpenProxy = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const cart = useCartStore();
const metodoPagamento = ref("");

function itemSubtotal(item) {
  const addonsTotal = item.addons
    ? item.addons.reduce((sum, a) => sum + Number(a.preco), 0)
    : 0;
  return (Number(item.preco) + addonsTotal) * item.quantidade;
}

const cartTotal = computed(() => {
  let subtotal = cart.items.reduce((t, i) => t + itemSubtotal(i), 0);
  const freteVal = Number(props.frete) || 0;
  if (props.selectedOrderType === "entrega") subtotal += freteVal;
  return subtotal;
});

function handleClose() {
  emit("close");
  emit("update:modelValue", false);
}

function handleProceed() {
  emit("proceed", {
    items: cart.items,
    total: cartTotal.value,
    orderData: props.orderData,
    tipo: props.selectedOrderType,
    frete: Number(props.frete) || 0,
    pagamento: metodoPagamento.value,
  });
  emit("update:modelValue", false);
}

/**
 * 🔹 Novo método para atualizar o método de pagamento recebido do PagamentoDialog
 * Trata tanto string simples (ex: "PIX") quanto objetos com troco (ex: { forma: "Dinheiro", troco: 50 })
 */
function handleConfirmarPagamento(pagamento) {
  if (typeof pagamento === "object" && pagamento.forma) {
    if (pagamento.forma === "Dinheiro" && pagamento.troco) {
      metodoPagamento.value = `Dinheiro (troco para R$ ${pagamento.troco.toFixed(
        2
      )})`;
    } else {
      metodoPagamento.value = pagamento.forma;
    }
  } else {
    metodoPagamento.value = pagamento;
  }
}

// 🔹 Exponha o método para ser chamado de fora (ex: ConfirmOrder abre PagamentoDialog)
defineExpose({ handleConfirmarPagamento });
</script>

<style scoped>
ul {
  padding-left: 1rem;
}
</style>
