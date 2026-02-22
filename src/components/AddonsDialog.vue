<template>
  <q-dialog v-model="isOpenProxy" persistent>
    <q-card style="min-width: 300px; max-width: 90vw">
      <q-card-section>
        <div class="text-h6">Escolher adicionais</div>
        <div class="text-subtitle2">{{ product?.nome }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="column q-gutter-md">
        <template v-if="optionGroups.length">
          <div
            v-for="(option, index) in optionGroups"
            :key="getOptionKey(option, index)"
            class="q-gutter-sm"
          >
            <div class="text-subtitle1">
              {{ option.name || `Grupo ${index + 1}` }}
              <span v-if="option.required" class="text-negative">*</span>
            </div>

            <q-option-group
              v-model="selectedByOption[getOptionKey(option, index)]"
              :options="buildGroupOptions(option, index)"
              :type="isSingleChoice(option) ? 'radio' : 'checkbox'"
            />

            <div class="text-caption text-grey-7">
              <span v-if="option.required">Obrigatório. </span>
              <span v-if="option.min_choices > 0">
                Mínimo: {{ option.min_choices }}.
              </span>
              <span v-if="option.max_choices != null">
                Máximo: {{ option.max_choices }}.
              </span>
            </div>

            <div
              v-if="validationByOption[getOptionKey(option, index)]"
              class="text-caption text-negative"
            >
              {{ validationByOption[getOptionKey(option, index)] }}
            </div>
          </div>
        </template>
        <div v-else class="text-grey-7">Este produto não possui adicionais.</div>
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
import { useQuasar } from "quasar";
import { useAppDialog } from "src/utils/dialogs";
import {
  buildSelectionPayload,
  getOptionKey,
  getSelectedIds,
  isSingleChoice,
  validateOptionGroups,
} from "src/utils/publicOptionSelection";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  product: { type: Object, default: null },
  addons: { type: Array, default: () => [] },
});
const emit = defineEmits(["update:isOpen", "confirm"]);

const isOpenProxy = computed({
  get: () => props.isOpen,
  set: (val) => emit("update:isOpen", val),
});

const $q = useQuasar();
const { confirm } = useAppDialog();
const selectedByOption = ref({});
const validationByOption = ref({});

const optionGroups = computed(() => {
  if (Array.isArray(props.product?.options)) {
    return props.product.options;
  }

  if ((props.addons || []).length === 0) {
    return [];
  }

  return [
    {
      id: "legacy-addons",
      name: "Adicionais",
      type: "multiple",
      required: false,
      min_choices: 0,
      max_choices: null,
      items: props.addons,
    },
  ];
});

watch(
  () => props.isOpen,
  (val) => {
    if (!val) return;

    validationByOption.value = {};
    selectedByOption.value = optionGroups.value.reduce((acc, option, index) => {
      const key = getOptionKey(option, index);
      acc[key] = isSingleChoice(option) ? null : [];
      return acc;
    }, {});
  }
);

function formatPrice(price) {
  return Number(price || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function itemLabel(item) {
  const price = Number(item?.price ?? 0);
  if (price > 0) {
    return `${item?.name} (+R$ ${formatPrice(price)})`;
  }

  return item?.name;
}

function buildGroupOptions(option, index) {
  const selectedIds = getSelectedIds(selectedByOption.value, option, index);
  const maxChoices = Number(option?.max_choices);
  const hasMaxChoices = Number.isFinite(maxChoices) && maxChoices > 0;
  const maxReached = !isSingleChoice(option) && hasMaxChoices && selectedIds.length >= maxChoices;

  return (option?.items || []).map((item, itemIndex) => {
    const itemId = String(item?.id ?? `item-${itemIndex}`);
    const isSelected = selectedIds.includes(itemId);

    return {
      label: itemLabel(item),
      value: itemId,
      disable: item?.is_active === false || (!isSelected && maxReached),
    };
  });
}


function validateSelections() {
  const nextErrors = validateOptionGroups(optionGroups.value, selectedByOption.value);
  validationByOption.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
}

function confirmAddWithAddons() {
  if (!validateSelections()) {
    $q.notify({
      type: "negative",
      message: "Revise as opções obrigatórias antes de continuar.",
      position: "top",
    });
    return;
  }

  const selection = buildSelectionPayload(optionGroups.value, selectedByOption.value);

  confirm({
    title: "Confirmar adicionais",
    message: `Adicionar <b> ${props.product?.nome || ""}</b> ${
      selection.flat.length > 0 ? "com " + selection.flat.length : "sem"
    } adicionais?`,
    icon: "shopping_cart",
  }).onOk(() => {
    emit("confirm", {
      product: props.product,
      addons: selection.flat,
      selection,
    });
    emit("update:isOpen", false);
  });
}
</script>
