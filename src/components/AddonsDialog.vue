<template>
  <q-dialog v-model="isOpenProxy" persistent>
    <q-card style="min-width: 300px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Escolher adicionais</div>
        <div class="text-subtitle2">{{ product?.nome }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-option-group
          v-model="selectedAddons"
          :options="addonOptions"
          type="checkbox"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
        <q-btn
          flat
          label="Prosseguir"
          color="positive"
          @click="confirmAddWithAddons"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useCartStore } from "src/store/cart";
import { useAppDialog } from "src/utils/dialogs";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  product: { type: Object, default: null },
  addons: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:isOpen"]);

const isOpenProxy = computed({
  get: () => props.isOpen,
  set: (val) => emit("update:isOpen", val),
});

const cart = useCartStore();
const { confirm } = useAppDialog();
const selectedAddons = ref([]);

watch(
  () => props.isOpen,
  (val) => {
    if (val) selectedAddons.value = [];
  }
);

const addonOptions = computed(() =>
  (props.addons || []).map((a) => ({
    label: `${a.nome} (+R$${Number(a.preco).toFixed(2)})`,
    value: a,
  }))
);

function confirmAddWithAddons() {
  confirm({
    title: "Confirmar adicionais",
    message: `Adicionar <b> ${props.product?.nome || ""}</b> ${
      selectedAddons.value.length > 0
        ? "com " + selectedAddons.value.length
        : "sem"
    } adicionais?`,
    icon: "shopping_cart",
  }).onOk(() => {
    cart.addItem(props.product, selectedAddons.value);
    emit("update:isOpen", false);
  });
}
</script>
