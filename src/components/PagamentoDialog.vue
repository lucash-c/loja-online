<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 360px; max-width: 420px">
      <!-- Cabeçalho -->
      <q-toolbar class="q-pa-none q-mb-xs">
        <q-toolbar-title class="text-h6 text-center" style="flex: 1">
          {{ etapaPix ? "Pagamento via PIX" : "Escolha a forma de pagamento" }}
        </q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="
            isOpen = false;
            resetarPix();
          "
        />
      </q-toolbar>

      <q-separator />

      <q-card-section class="flex flex-center column">
        <!-- Lista de formas de pagamento -->
        <q-list
          v-if="!etapaPix && !pagamentoDinheiro"
          bordered
          class="full-width"
        >
          <q-item
            v-for="(label, key) in formasDisponiveis"
            :key="key"
            clickable
            v-ripple
            @click="selecionarForma(key)"
          >
            <q-item-section>{{ label }}</q-item-section>
          </q-item>
        </q-list>

        <!-- Etapa pagamento em dinheiro -->
        <div v-if="pagamentoDinheiro" class="q-mt-md full-width">
          <div class="text-h6 text-center q-mb-md">Pagamento em Dinheiro</div>

          <q-option-group
            v-model="precisaTroco"
            :options="[
              { label: 'Não preciso de troco', value: 'nao' },
              { label: 'Preciso de troco', value: 'sim' },
            ]"
            color="primary"
            inline
          />

          <q-slide-transition>
            <div v-if="precisaTroco === 'sim'" class="q-mt-md">
              <q-input
                v-model="valorTrocoFormatado"
                label="Troco para quanto?"
                outlined
                dense
                :error="erroTroco"
                :error-message="mensagemErroTroco"
                @update:model-value="formatarValorTroco"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_money" />
                </template>
              </q-input>
            </div>
          </q-slide-transition>

          <div class="q-mt-lg flex justify-around">
            <q-btn
              color="negative"
              flat
              icon="arrow_back"
              label="Voltar"
              @click="cancelarTroco"
            />
            <q-btn
              color="primary"
              icon="check_circle"
              label="Confirmar"
              @click="confirmarTroco"
              :disable="precisaTroco === 'sim' && erroTroco"
            />
          </div>
        </div>

        <!-- Loading: gerando QR Code -->
        <div v-if="loadingPix" class="q-mt-lg text-center">
          <q-spinner-dots size="40px" color="primary" />
          <div class="text-subtitle2 q-mt-sm">Gerando QR Code PIX...</div>
        </div>

        <!-- Etapa PIX -->
        <div
          v-if="etapaPix && qrCode && !loadingPix"
          class="q-mt-md flex flex-center column"
        >
          <div class="text-h6 text-primary q-mb-md">
            Valor: R$ {{ props.total.toFixed(2) }}
          </div>

          <img
            :src="`data:image/png;base64,${qrCode}`"
            alt="QR Code PIX"
            width="220"
            class="q-mb-md shadow-2 rounded-borders"
          />

          <!-- 🔹 Temporizador bonito -->
          <div
            v-if="tempoRestante > 0"
            class="text-center q-mb-md text-bold text-deep-orange"
            style="font-size: 18px"
          >
            <q-icon
              name="timer"
              color="deep-orange"
              size="20px"
              class="q-mr-xs"
            />
            Tempo restante: {{ minutos }}:{{ segundos }}
          </div>

          <div v-else class="text-negative text-center q-mb-md">
            <q-icon name="warning" color="negative" class="q-mr-xs" />
            Tempo expirado. Fechando janela...
          </div>

          <!-- Campo de código PIX clicável -->
          <div class="q-mt-sm flex items-start q-gutter-sm full-width">
            <q-input
              v-model="qrCodeText"
              label="Copia e Cola PIX"
              type="textarea"
              autogrow
              readonly
              outlined
              dense
              class="col"
              @click="copiarPix"
            />
            <q-btn
              flat
              round
              color="primary"
              icon="content_copy"
              @click="copiarPix"
            />
          </div>

          <!-- Botão de simulação (sandbox) -->
          <div class="q-mt-md flex justify-around full-width">
            <q-btn
              v-if="isSandbox"
              label="Simular pagamento"
              color="accent"
              flat
              icon="auto_fix_high"
              @click="simularPagamentoAprovado"
            />
          </div>
        </div>

        <!-- Aguardando aprovação -->
        <div v-if="aguardandoAprovacao" class="q-mt-lg text-center">
          <q-spinner-hourglass size="50px" color="primary" />
          <div class="text-subtitle2 q-mt-md text-grey-8">
            Aguardando aprovação do PIX...
          </div>
          <div class="text-caption text-grey q-mt-xs">
            Isso pode levar alguns segundos.
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import { getFormasPagamento } from "../services/sheetApi";
import {
  gerarPixQrCode,
  verificarStatusPix,
  simularPagamentoPix,
} from "../services/paymentService";

const $q = useQuasar();
const isSandbox = false;

const props = defineProps({
  total: { type: Number, required: true },
});

const emit = defineEmits(["confirmar"]);

const isOpen = ref(false);
const formasDisponiveis = ref({});
const qrCode = ref(null);
const qrCodeText = ref(null);
const loadingPix = ref(false);
const etapaPix = ref(false);
const aguardandoAprovacao = ref(false);
const pagamentoDinheiro = ref(false);
const precisaTroco = ref("nao");
const valorTroco = ref(null);
const valorTrocoFormatado = ref("");
const erroTroco = ref(false); // ✅ Corrigido
const mensagemErroTroco = ref("");
const paymentId = ref(null);

let intervalCheck = null;

// 🔹 Temporizador de 5 minutos
const tempoRestante = ref(0);
let timerInterval = null;

const minutos = computed(() =>
  String(Math.floor(tempoRestante.value / 60)).padStart(2, "0")
);
const segundos = computed(() =>
  String(tempoRestante.value % 60).padStart(2, "0")
);

function iniciarTemporizador() {
  tempoRestante.value = 300; // 5 minutos
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (tempoRestante.value > 0) {
      tempoRestante.value--;
    } else {
      clearInterval(timerInterval);
      $q.notify({
        type: "negative",
        message: "Tempo expirado! Fechando pagamento PIX.",
      });
      resetarPix();
      isOpen.value = false;
    }
  }, 1000);
}

function pararTemporizador() {
  clearInterval(timerInterval);
  tempoRestante.value = 0;
}

// 🔹 Funções troco (restauradas)
function formatarValorTroco(valor) {
  if (!valor) {
    valorTrocoFormatado.value = "";
    valorTroco.value = null;
    erroTroco.value = false;
    mensagemErroTroco.value = "";
    return;
  }

  const num = valor.replace(/\D/g, "");
  const float = parseFloat(num) / 100;

  if (!isNaN(float)) {
    valorTroco.value = float;
    valorTrocoFormatado.value = float.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    validarTroco();
  }
}

function validarTroco() {
  if (!valorTroco.value || valorTroco.value < props.total) {
    erroTroco.value = true;
    mensagemErroTroco.value = `O valor informado (R$ ${valorTroco.value?.toFixed(
      2
    )}) é menor que o total do pedido (R$ ${props.total.toFixed(2)}).`;
  } else {
    erroTroco.value = false;
    mensagemErroTroco.value = "";
  }
}

function cancelarTroco() {
  pagamentoDinheiro.value = false;
  precisaTroco.value = "nao";
  valorTroco.value = null;
  valorTrocoFormatado.value = "";
  erroTroco.value = false;
  mensagemErroTroco.value = "";
}

function confirmarTroco() {
  if (erroTroco.value && precisaTroco.value === "sim") {
    $q.notify({
      type: "negative",
      message: "O valor do troco é menor que o total do pedido.",
    });
    return;
  }

  const detalhes = {
    forma: "Dinheiro",
    troco: precisaTroco.value === "sim" ? valorTroco.value : null,
  };
  isOpen.value = false;
  resetarPix();
  emit("confirmar", detalhes);
}

// 🔹 Reset geral
function resetarPix() {
  etapaPix.value = false;
  qrCode.value = null;
  qrCodeText.value = null;
  aguardandoAprovacao.value = false;
  paymentId.value = null;
  clearInterval(intervalCheck);
  pararTemporizador();
}

// 🔹 Função open original
async function open() {
  isOpen.value = true;
  etapaPix.value = false;
  qrCode.value = null;
  qrCodeText.value = null;
  pagamentoDinheiro.value = false;

  const formas = await getFormasPagamento();
  const aceitas = formas[0] || {};
  formasDisponiveis.value = {};

  Object.entries(aceitas).forEach(([key, value]) => {
    if (value.toUpperCase() === "SIM") {
      formasDisponiveis.value[key] = formatarLabel(key);
    }
  });
}

function formatarLabel(key) {
  switch (key) {
    case "pix":
      return "PIX";
    case "debito_online":
      return "Débito Online";
    case "credito_online":
      return "Crédito Online";
    case "debito_maquininha":
      return "Débito Maquininha";
    case "credito_maquininha":
      return "Crédito Maquininha";
    case "alimentacao_maquininha":
      return "Vale Alimentação";
    case "dinheiro":
      return "Dinheiro";
    default:
      return key;
  }
}

async function selecionarForma(key) {
  if (key === "pix") {
    etapaPix.value = true;
    loadingPix.value = true;

    const result = await gerarPixQrCode(props.total, "Pagamento do Pedido");

    if (result) {
      qrCode.value = result.qrCodeBase64;
      qrCodeText.value = result.qrCodeText;
      paymentId.value = result.paymentId;
      iniciarTemporizador();
      monitorarPagamento();
    }

    loadingPix.value = false;
  } else if (key === "dinheiro") {
    pagamentoDinheiro.value = true;
  } else {
    isOpen.value = false;
    emitirPagamentoEscolhido(key);
  }
}

function emitirPagamentoEscolhido(key) {
  const label = formasDisponiveis.value[key];
  isOpen.value = false;
  resetarPix();
  emit("confirmar", label);
}

function monitorarPagamento() {
  if (!paymentId.value) return;
  aguardandoAprovacao.value = true;

  intervalCheck = setInterval(async () => {
    const status = await verificarStatusPix(paymentId.value);
    if (status === "approved") {
      clearInterval(intervalCheck);
      aguardandoAprovacao.value = false;
      pararTemporizador();
      $q.notify({
        message: "Pagamento aprovado! Enviando pedido...",
        type: "positive",
      });
      setTimeout(() => emitirPagamentoEscolhido("pix"), 1200);
    }
  }, 5000);
}

defineExpose({ open });
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
