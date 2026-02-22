<template>
  <q-drawer
    v-model="isOpenProxy"
    side="right"
    overlay
    bordered
    content-class="bg-grey-1"
    class="cart-drawer"
  >
    <!-- Cabeçalho -->
    <q-toolbar class="cart-header">
      <q-icon name="shopping_cart" size="md" color="primary" class="q-mr-sm" />
      <q-toolbar-title class="text-weight-medium text-primary">
        Meu Carrinho
      </q-toolbar-title>
      <q-btn
        flat
        round
        dense
        icon="close"
        color="grey-7"
        @click="isOpenProxy = false"
        class="hover-scale"
      />
    </q-toolbar>

    <!-- Lista de Itens -->
    <q-list padding class="q-pa-sm cart-list">
      <q-item
        v-for="item in cart.items"
        :key="item.product_id + JSON.stringify(item.options)"
        class="cart-item q-pa-sm"
      >
        <div class="flex items-center" style="width: 100%">
          <!-- Imagem -->
          <q-img
            :src="getImageSrc(item.image_url)"
            :alt="item.product_name"
            width="55px"
            height="55px"
            class="rounded-borders shadow-2 q-mr-md"
          />

          <!-- Conteúdo -->
          <div class="col">
            <div class="text-subtitle1 text-weight-medium q-mb-xs">
              {{ item.product_name }}
            </div>

            <div class="text-caption text-grey-7">
              R$ {{ itemBasePrice(item).toFixed(2) }} x {{ item.quantity }}
            </div>

            <div
              v-if="item.options && item.options.length"
              class="q-mt-xs flex wrap items-center"
            >
              <q-chip
                dense
                color="orange-1"
                text-color="deep-orange-9"
                icon="add_circle"
                class="q-mr-xs q-mb-xs option-total-chip"
                :label="`Somando adicionais: +R$ ${itemOptionsPrice(
                  item
                ).toFixed(2)}`"
              />
              <q-badge
                v-for="option in item.options"
                :key="`${option.option_id}-${option.item_id}`"
                dense
                color="blue-grey-1"
                text-color="blue-grey-9"
                class="q-mr-xs q-mb-xs q-pr-sm"
              >
                + {{ optionLabel(option) }} • R$
                {{ Number(option.price).toFixed(2) }}
              </q-badge>
            </div>

            <div class="text-primary text-caption q-mt-xs text-weight-medium">
              <strong>Total do item:</strong> R$
              {{ itemSubtotal(item).toFixed(2) }}
            </div>
          </div>

          <!-- Botões de quantidade -->
          <div class="q-ml-sm flex column items-center">
            <q-btn
              dense
              flat
              round
              icon="add"
              color="positive"
              size="sm"
              @click="increase(item)"
            />
            <q-btn
              dense
              flat
              round
              icon="remove"
              color="negative"
              size="sm"
              @click="decrease(item)"
            />
          </div>
        </div>
      </q-item>

      <q-separator spaced />
    </q-list>

    <!-- Total -->
    <div class="cart-total q-pa-md bg-grey-2 rounded-borders shadow-1">
      <div class="text-subtitle1 text-weight-medium text-center">
        Total: <span class="text-primary">R$ {{ cartTotal.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Ações -->
    <div class="q-pa-md flex justify-center q-gutter-sm">
      <q-btn
        color="negative"
        label="Esvaziar carrinho"
        icon="delete_forever"
        @click="confirmClearCart"
        :disable="!cart.items.length"
        class="full-width text-weight-medium"
        glossy
      />

      <q-btn
        color="primary"
        label="Enviar pedido"
        icon="send"
        @click="openOrderTypeDialog"
        :disable="!cart.items.length || isSubmittingOrder"
        class="full-width text-weight-medium"
        glossy
      />
    </div>

    <!-- Dialog tipo de pedido -->
    <q-dialog v-model="orderTypeDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Como deseja receber?</div>
        </q-card-section>
        <q-card-actions align="around">
          <q-btn
            color="primary"
            label="Entrega"
            @click="selectOrderType('entrega')"
          />
          <q-btn
            color="secondary"
            label="Retirada"
            @click="selectOrderType('retirada')"
          />
          <q-btn
            color="accent"
            label="Comer na Loja"
            @click="selectOrderType('local')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog dados do pedido -->
    <q-dialog v-model="orderDataDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Preencha seus dados</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input v-model="orderData.nome" label="Nome" outlined dense />
          <q-input
            v-if="selectedOrderType === 'entrega'"
            v-model="cepCliente"
            label="CEP"
            outlined
            dense
            mask="#####-###"
            hint="Digite seu CEP e aguarde o preenchimento automático"
            @blur="buscarEnderecoPorCep"
          />

          <div v-if="endereco.logradouro && selectedOrderType === 'entrega'">
            <q-input
              v-model="endereco.logradouro"
              label="Logradouro"
              readonly
              outlined
              dense
            />
            <q-input
              v-model="endereco.bairro"
              label="Bairro"
              readonly
              outlined
              dense
            />
            <q-input
              v-model="endereco.localidade"
              label="Cidade"
              readonly
              outlined
              dense
            />
            <q-input v-model="orderData.numero" label="Número" outlined dense />
          </div>

          <q-input
            v-if="selectedOrderType === 'local'"
            v-model="orderData.mesa"
            label="Mesa"
            outlined
            dense
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary"
            label="Enviar"
            :loading="loading"
            :disable="loading || isSubmittingOrder"
            @click="sendOrder"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Pagamento -->
    <PagamentoDialog
      ref="pagamentoDialog"
      :total="cartTotal"
      :isSubmitting="isSubmittingOrder"
      @confirmar="enviarPedidoWhatsapp"
    />

    <!-- Dialog de aviso -->
    <q-dialog v-model="showDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Aviso</div>
          <div>{{ dialogMessage }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" v-close-popup @click="showDialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog de carregamento bonito -->
    <q-dialog v-model="loading">
      <q-card class="q-pa-lg flex flex-center column" style="min-width: 200px">
        <q-spinner-facebook color="primary" size="40px" />
        <div class="q-mt-md text-primary text-weight-medium">
          Aguarde um momento...
        </div>
      </q-card>
    </q-dialog>
  </q-drawer>

  <!-- Dialog de confirmação do pedido -->
  <ConfirmOrder
    v-model="confirmOrderDialog"
    :orderData="orderData"
    :selectedOrderType="selectedOrderType"
    :endereco="endereco"
    :frete="frete"
    :tempoEntrega="tempoEntrega"
    :distanciaKm="distanciaKm"
    :cart="cart"
    :cartTotal="cartTotal"
    @close="confirmOrderDialog = false"
    @proceed="abrirPagamento"
  />
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Dialog } from "quasar";
import { useCartStore } from "src/store/cart";
import { useAppDialog } from "src/utils/dialogs";
import { useRouter } from "vue-router";
import PagamentoDialog from "../components/PagamentoDialog.vue";
import ConfirmOrder from "../components/ConfirmOrder.vue";
import { getImageSrc } from "../utils/image";
import { calcularEntrega } from "src/services/deliveryService";
import { createPublicOrder, getLojaKeyOrThrow } from "src/services/orderApi";
import { useRoute } from "vue-router";
import { resolvePublicKey } from "src/store/publicContext";

const props = defineProps({ isOpen: { type: Boolean, default: false } });
const emit = defineEmits(["update:isOpen"]);

const isOpenProxy = computed({
  get: () => props.isOpen,
  set: (val) => emit("update:isOpen", val),
});

const cart = useCartStore();
const { confirm } = useAppDialog();
const router = useRouter();
const route = useRoute();
const pagamentoDialog = ref(null);
const lojaData = JSON.parse(localStorage.getItem("loja") || "{}");

// Dialogs e dados do pedido
const orderTypeDialog = ref(false);
const orderDataDialog = ref(false);
const selectedOrderType = ref("");
const orderData = ref({ nome: "", cep: "", numero: "", mesa: "" });
const confirmOrderDialog = ref(false);

// CEP, endereço e frete
const cepCliente = ref("");
const endereco = ref({});
const frete = ref(0);
const entregaAtende = ref(false);
const tempoEntrega = ref("");
const distanciaKm = ref(0);
const mensagemEntrega = ref("");

// Dialog de aviso
const showDialog = ref(false);
const dialogMessage = ref("");

// Loading
const loading = ref(false);
const isSubmittingOrder = ref(false);
const IDEMPOTENCY_STORAGE_KEY = "checkout:idempotency-key";

// Total do carrinho
const cartTotal = computed(() => {
  let subtotal = cart.items.reduce((t, i) => t + itemSubtotal(i), 0);
  if (selectedOrderType.value === "entrega" && entregaAtende.value) {
    subtotal += Number(frete.value || 0);
  }
  return subtotal;
});

function openOrderTypeDialog() {
  try {
    getLojaKeyOrThrow(route);
    orderTypeDialog.value = true;
  } catch (error) {
    dialogMessage.value =
      error.message || "Não foi possível enviar pedidos agora.";
    showDialog.value = true;
  }
}

function selectOrderType(type) {
  selectedOrderType.value = type;
  orderTypeDialog.value = false;
  orderDataDialog.value = true;
}

async function sendOrder() {
  if (!orderData.value.nome) {
    dialogMessage.value = "Por favor, insira seu nome.";
    showDialog.value = true;
    return;
  }

  let resultado = null;
  loading.value = true; // 🔹 Mostra o loading antes de começar o cálculo
  try {
    if (selectedOrderType.value === "entrega") {
      const cepLimpo = (cepCliente.value || "").replace(/\D/g, "");
      if (!cepLimpo || !endereco.value.logradouro) {
        loading.value = false;
        dialogMessage.value = "Por favor, insira um CEP válido para entrega.";
        showDialog.value = true;
        return;
      }
      if (!orderData.value.numero) {
        loading.value = false;
        dialogMessage.value = "Por favor, insira o número do endereço.";
        showDialog.value = true;
        return;
      }

      resultado = await calcularEntrega(cepLimpo, "entrega");

      if (!resultado.atende) {
        entregaAtende.value = false;
        frete.value = 0;
        tempoEntrega.value = "";
        mensagemEntrega.value = resultado.mensagem;
        dialogMessage.value = resultado.mensagem;
        showDialog.value = true;
        loading.value = false;
        return;
      }

      entregaAtende.value = true;
      distanciaKm.value = Number(resultado.distancia || 0);
      orderData.value.cep = cepCliente.value;
    } else if (selectedOrderType.value === "retirada") {
      resultado = await calcularEntrega("", "retirada");
      entregaAtende.value = true;
      distanciaKm.value = 0;
      orderData.value.cep = "";
      orderData.value.numero = "";
      endereco.value = {};
    } else if (selectedOrderType.value === "local") {
      if (!orderData.value.mesa) {
        loading.value = false;
        dialogMessage.value = "Por favor, insira o número da mesa.";
        showDialog.value = true;
        return;
      }
      resultado = await calcularEntrega("", "local");
      entregaAtende.value = true;
      distanciaKm.value = 0;
      orderData.value.cep = "";
      orderData.value.numero = "";
      endereco.value = {};
    }

    // Definir tempo, frete e mensagem
    tempoEntrega.value = resultado.tempo ? `${resultado.tempo} min` : "";
    frete.value = resultado.taxa || 0;
    mensagemEntrega.value = resultado.mensagem || "";

    orderDataDialog.value = false;
    confirmOrderDialog.value = true;
  } catch (err) {
    console.error("Erro ao processar o pedido:", err);
    dialogMessage.value = "Erro ao calcular o pedido. Tente novamente.";
    showDialog.value = true;
  } finally {
    loading.value = false; // 🔹 Sempre encerra o loading
  }
}

function formatPaymentMethod(metodoPagamento) {
  if (typeof metodoPagamento === "object" && metodoPagamento.forma) {
    if (metodoPagamento.forma === "Dinheiro" && metodoPagamento.troco) {
      return `Dinheiro (Troco R$ ${Number(
        metodoPagamento.troco - cartTotal.value
      ).toFixed(2)})`;
    }

    return metodoPagamento.forma;
  }

  return metodoPagamento;
}

function buildPublicOrderPayload(metodoPagamentoTexto) {
  const isEntrega = selectedOrderType.value === "entrega";
  const isLocal = selectedOrderType.value === "local";
  const deliveryEstimatedTimeMinutes = Number.parseInt(
    String(tempoEntrega.value || "").replace(/\D/g, ""),
    10
  );

  return {
    order_type: selectedOrderType.value,
    customer_name: orderData.value.nome,
    table: isLocal ? orderData.value.mesa || null : null,
    payment_method: metodoPagamentoTexto,
    items: cart.items.map((item) => ({
      product_name: item.product_name,
      quantity: Number(item.quantity) || 0,
      unit_price: Number(item.unit_price) || 0,
      options: (item.options || []).map((option) => ({
        option_id: option.option_id,
        option_name: option.option_name,
        item_id: option.item_id,
        item_name: option.item_name,
        price: Number(option.price) || 0,
      })),
    })),
    delivery_address: isEntrega
      ? {
          cep: orderData.value.cep || "",
          street: endereco.value.logradouro || "",
          number: orderData.value.numero || "",
          neighborhood: endereco.value.bairro || "",
          city: endereco.value.localidade || "",
          state: endereco.value.uf || "",
        }
      : null,
    delivery_fee: isEntrega ? Number(frete.value) || 0 : 0,
    delivery_distance_km: isEntrega ? Number(distanciaKm.value) || 0 : null,
    delivery_estimated_time_minutes:
      isEntrega && !Number.isNaN(deliveryEstimatedTimeMinutes)
        ? deliveryEstimatedTimeMinutes
        : null,
    origin: "cardapio-online",
  };
}

function gerarIdempotencyKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `pedido-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPersistedIdempotencyKey() {
  return localStorage.getItem(IDEMPOTENCY_STORAGE_KEY) || "";
}

function persistIdempotencyKey(key) {
  localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, key);
}

function clearPersistedIdempotencyKey() {
  localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
}

function getSuccessRouteLocation() {
  const currentPublicKey = resolvePublicKey(route);

  if (!currentPublicKey) {
    throw new Error("Não encontramos a chave pública para concluir o pedido.");
  }

  return {
    name: "order-success",
    params: { publicKey: currentPublicKey },
  };
}

function getOrCreateIdempotencyKey() {
  const existingKey = getPersistedIdempotencyKey();
  if (existingKey) {
    return existingKey;
  }

  const newKey = gerarIdempotencyKey();
  persistIdempotencyKey(newKey);
  return newKey;
}

async function enviarPedidoWhatsapp(metodoPagamento) {
  if (!lojaData || lojaData.status?.toLowerCase() !== "aberto") {
    Dialog.create({
      title: "Loja Fechada",
      message:
        "No momento a loja encontra-se fechada. Tente novamente em outro horário.",
      ok: {
        label: "Entendido",
        color: "primary",
      },
      persistent: true,
    });
    return; // ⛔ Interrompe o fluxo do pedido
  }

  if (isSubmittingOrder.value) {
    return;
  }

  let lojaKey = "";
  try {
    lojaKey = getLojaKeyOrThrow(route);
  } catch (error) {
    dialogMessage.value =
      error.message || "Não foi possível enviar pedidos agora.";
    showDialog.value = true;
    return;
  }

  const metodoPagamentoTexto = formatPaymentMethod(metodoPagamento);
  const payload = buildPublicOrderPayload(metodoPagamentoTexto);
  const idempotencyKey = getOrCreateIdempotencyKey();

  loading.value = true;
  isSubmittingOrder.value = true;

  try {
    await createPublicOrder(payload, lojaKey, idempotencyKey);

    cart.clearCart();
    clearPersistedIdempotencyKey();
    isOpenProxy.value = false;
    router.push(getSuccessRouteLocation());
  } catch (error) {
    if (error.code === "TIMEOUT_ERROR") {
      try {
        await createPublicOrder(payload, lojaKey, idempotencyKey);
        cart.clearCart();
        clearPersistedIdempotencyKey();
        isOpenProxy.value = false;
        router.push(getSuccessRouteLocation());
        return;
      } catch (retryError) {
        if (retryError.code !== "TIMEOUT_ERROR") {
          clearPersistedIdempotencyKey();
        }
        dialogMessage.value =
          retryError.code === "TIMEOUT_ERROR"
            ? "O pedido está demorando para responder. Tente novamente; vamos reutilizar a mesma confirmação para evitar duplicidade."
            : retryError.message ||
              "Não foi possível enviar seu pedido. Tente novamente.";
        showDialog.value = true;
        return;
      }
    }

    clearPersistedIdempotencyKey();
    dialogMessage.value =
      error.message || "Não foi possível enviar seu pedido. Tente novamente.";
    showDialog.value = true;
  } finally {
    loading.value = false;
    isSubmittingOrder.value = false;
  }
}

function itemSubtotal(item) {
  return cart.itemSubtotal(item);
}

function itemBasePrice(item) {
  return Number(item?.base_unit_price ?? item?.unit_price ?? 0);
}

function itemOptionsPrice(item) {
  const explicitOptionsPrice = Number(item?.options_unit_price);
  if (Number.isFinite(explicitOptionsPrice)) {
    return explicitOptionsPrice;
  }

  return (item?.options || []).reduce(
    (total, option) => total + Number(option?.price || 0),
    0
  );
}

function optionLabel(option) {
  return option?.name || option?.item_name || "Adicional";
}

function confirmClearCart() {
  confirm({
    title: "Esvaziar Carrinho",
    message: "Tem certeza que deseja <b>esvaziar</b> todo o carrinho?",
    icon: "warning",
  }).onOk(() => cart.clearCart());
}

function increase(item) {
  const index = cart.items.findIndex(
    (i) =>
      i.product_id === item.product_id &&
      JSON.stringify(i.options || []) === JSON.stringify(item.options || [])
  );
  if (index !== -1) cart.increaseQty(index);
}

function decrease(item) {
  const index = cart.items.findIndex(
    (i) =>
      i.product_id === item.product_id &&
      JSON.stringify(i.options || []) === JSON.stringify(item.options || [])
  );
  if (index !== -1) cart.decreaseQty(index);
}

async function buscarEnderecoPorCep() {
  const cep = cepCliente.value.replace(/\D/g, "");
  if (cep.length !== 8) return;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const d = await r.json();
    if (d.erro) throw new Error("CEP não encontrado.");
    endereco.value = {
      logradouro: d.logradouro,
      bairro: d.bairro,
      localidade: d.localidade,
      uf: d.uf,
    };
  } catch (e) {
    entregaAtende.value = false;
    mensagemEntrega.value = "Erro ao buscar CEP.";
    console.error(e);
  }
}

watch(cepCliente, (v) => {
  if (v.replace(/\D/g, "").length === 8) buscarEnderecoPorCep();
});

function abrirPagamento(order) {
  getOrCreateIdempotencyKey();
  pagamentoDialog.value?.open(order);
}
</script>

<style scoped>
.cart-drawer {
  width: 50vw;
  max-width: 100vw;
}
.cart-header {
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 8px 12px;
  position: sticky;
  top: 0;
  z-index: 2;
}
.cart-item {
  background-color: #fff;
  border-radius: 10px;
  margin: 6px 0;
  padding: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.cart-list {
  max-height: calc(100dvh - 220px);
  overflow-y: auto;
}
.text-subtitle1 {
  font-size: 0.95rem;
}
.text-caption {
  font-size: 0.8rem;
}
.cart-total {
  border-top: 1px solid #eee;
  background-color: #fafafa;
  font-size: 0.9rem;
  padding-top: 0.8rem;
}
.hover-scale:hover {
  transform: scale(1.1);
  transition: 0.2s ease;
}
.option-total-chip {
  font-weight: 600;
}

@media (max-width: 600px) {
  .cart-drawer {
    width: 100vw;
  }

  .cart-item {
    border-radius: 12px;
  }
}
</style>
