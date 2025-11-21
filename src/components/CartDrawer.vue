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
    <q-list padding class="q-pa-sm">
      <q-item
        v-for="item in cart.items"
        :key="item.codigo + JSON.stringify(item.addons)"
        class="cart-item q-pa-sm"
      >
        <div class="flex items-center" style="width: 100%">
          <!-- Imagem -->
          <q-img
            :src="getImageSrc(item.imagem)"
            :alt="item.nome"
            width="55px"
            height="55px"
            class="rounded-borders shadow-2 q-mr-md"
          />

          <!-- Conteúdo -->
          <div class="col">
            <div class="text-subtitle1 text-weight-medium q-mb-xs">
              {{ item.nome }}
            </div>

            <div class="text-caption text-grey-7">
              R$ {{ Number(item.preco).toFixed(2) }} x {{ item.quantidade }}
            </div>

            <div
              v-if="item.addons && item.addons.length"
              class="q-mt-xs flex wrap"
            >
              <q-badge
                v-for="addon in item.addons"
                :key="addon.codigo"
                dense
                color="secondary"
                text-color="white"
                class="q-mr-xs q-mb-xs q-pr-sm"
              >
                + {{ addon.nome }} - R$ {{ Number(addon.preco).toFixed(2) }}
              </q-badge>
            </div>

            <div class="text-primary text-caption q-mt-xs">
              <strong>Subtotal:</strong> R$ {{ itemSubtotal(item).toFixed(2) }}
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
        :disable="!cart.items.length"
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
            @click="selectOrderType('loja')"
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
            v-if="selectedOrderType === 'loja'"
            v-model="orderData.mesa"
            label="Mesa"
            outlined
            dense
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Enviar" @click="sendOrder" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Pagamento -->
    <PagamentoDialog
      ref="pagamentoDialog"
      :total="cartTotal"
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

const props = defineProps({ isOpen: { type: Boolean, default: false } });
const emit = defineEmits(["update:isOpen"]);

const isOpenProxy = computed({
  get: () => props.isOpen,
  set: (val) => emit("update:isOpen", val),
});

const cart = useCartStore();
const { confirm } = useAppDialog();
const router = useRouter();
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

// Total do carrinho
const cartTotal = computed(() => {
  let subtotal = cart.items.reduce((t, i) => t + itemSubtotal(i), 0);
  if (selectedOrderType.value === "entrega" && entregaAtende.value) {
    subtotal += Number(frete.value || 0);
  }
  return subtotal;
});

function openOrderTypeDialog() {
  orderTypeDialog.value = true;
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
    } else if (selectedOrderType.value === "retirada") {
      resultado = await calcularEntrega("", "retirada");
      entregaAtende.value = true;
      distanciaKm.value = 0;
    } else if (selectedOrderType.value === "loja") {
      if (!orderData.value.mesa) {
        loading.value = false;
        dialogMessage.value = "Por favor, insira o número da mesa.";
        showDialog.value = true;
        return;
      }
      resultado = await calcularEntrega("", "loja");
      entregaAtende.value = true;
      distanciaKm.value = 0;
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

function enviarPedidoWhatsapp(metodoPagamento) {
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

  let metodoPagamentoTexto = "";
  if (typeof metodoPagamento === "object" && metodoPagamento.forma) {
    if (metodoPagamento.forma === "Dinheiro" && metodoPagamento.troco) {
      metodoPagamentoTexto = `Dinheiro (Troco R$ ${Number(
        metodoPagamento.troco - cartTotal.value
      ).toFixed(2)})`;
    } else {
      metodoPagamentoTexto = metodoPagamento.forma;
    }
  } else {
    metodoPagamentoTexto = metodoPagamento;
  }

  let mensagem = `*Novo Pedido*\n\n*Cliente:* ${orderData.value.nome}\n*Tipo de Pedido:* ${selectedOrderType.value}\n`;

  if (selectedOrderType.value === "entrega") {
    mensagem += `*Endereço:* ${endereco.value.logradouro}, ${orderData.value.numero} - ${endereco.value.bairro}, ${endereco.value.localidade}\n`;
    mensagem += `*CEP:* ${cepCliente.value}\n`;
    mensagem += `*Frete:* R$ ${Number(frete.value || 0).toFixed(2)}\n`;
  } else if (selectedOrderType.value === "loja") {
    mensagem += `*Mesa:* ${orderData.value.mesa}\n`;
  }

  mensagem += `\n*Itens:*\n`;
  cart.items.forEach((item) => {
    mensagem += `- ${item.quantidade}x ${item.nome} - R$ ${(
      Number(item.preco) * item.quantidade
    ).toFixed(2)}\n`;
    if (item.addons?.length) {
      item.addons.forEach(
        (addon) =>
          (mensagem += `   + ${addon.nome} - R$ ${Number(addon.preco).toFixed(
            2
          )}\n`)
      );
    }
  });

  mensagem += `\n*Total:* R$ ${cartTotal.value.toFixed(2)}\n`;
  mensagem += `*Tempo estimado:* ${tempoEntrega.value}\n`;
  mensagem += `*Pagamento:* ${metodoPagamentoTexto}\n`;

  const telefoneLoja = "55" + lojaData.whatsapp.replace(/\D/g, "");
  const url = `https://wa.me/${telefoneLoja}?text=${encodeURIComponent(
    mensagem
  )}`;
  window.open(url, "_blank");

  cart.clearCart();
  isOpenProxy.value = false;
  router.push("/");
}

function itemSubtotal(item) {
  const addonsTotal = item.addons
    ? item.addons.reduce((sum, a) => sum + Number(a.preco), 0)
    : 0;
  return (Number(item.preco) + addonsTotal) * item.quantidade;
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
      i.codigo === item.codigo &&
      JSON.stringify(i.addons || []) === JSON.stringify(item.addons || [])
  );
  if (index !== -1) cart.increaseQty(index);
}

function decrease(item) {
  const index = cart.items.findIndex(
    (i) =>
      i.codigo === item.codigo &&
      JSON.stringify(i.addons || []) === JSON.stringify(item.addons || [])
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
  pagamentoDialog.value?.open(order);
}
</script>

<style scoped>
.cart-drawer {
  width: 480px;
}
.cart-header {
  background: #fff;
  border-bottom: 1px solid #eee;
  padding: 8px 12px;
}
.cart-item {
  background-color: #fff;
  border-radius: 10px;
  margin: 6px 0;
  padding: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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
</style>
