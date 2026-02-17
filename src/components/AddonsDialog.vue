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
              {{ option.nome || `Grupo ${index + 1}` }}
              <span v-if="option.required" class="text-negative">*</span>
            </div>

            <q-option-group
              v-model="selectedByOption[getOptionKey(option, index)]"
              :options="buildGroupOptions(option, index)"
              :type="isSingleChoice(option) ? 'radio' : 'checkbox'"
            />

            <div class="text-caption text-grey-7">
              <span v-if="option.required">Obrigatório. </span>
              <span v-if="option.min_choices != null">
                Mínimo: {{ option.min_choices }}.
              </span>
              <span v-if="option.max_choices != null">
                Máximo: {{ option.max_choices }}.
              </span>
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

const optionGroups = computed(() => {
  if (Array.isArray(props.product?.options) && props.product.options.length > 0) {
    return props.product.options;
  }

  if ((props.addons || []).length === 0) {
    return [];
  }

  return [
    {
      id: "legacy-addons",
      nome: "Adicionais",
      required: false,
      min_choices: null,
      max_choices: null,
      items: props.addons,
    },
  ];
});

watch(
  () => props.isOpen,
  (val) => {
    if (!val) return;

    selectedByOption.value = optionGroups.value.reduce((acc, option, index) => {
      const key = getOptionKey(option, index);
      acc[key] = isSingleChoice(option) ? null : [];
      return acc;
    }, {});
  }
);

function getOptionKey(option, index) {
  return String(option?.id ?? option?.codigo ?? `option-${index}`);
}

function isSingleChoice(option) {
  return Number(option?.max_choices) === 1;
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function itemLabel(item) {
  const price = Number(item?.price ?? item?.preco ?? 0);
  if (price > 0) {
    return `${item?.nome || item?.name} (+R$ ${formatPrice(price)})`;
  }

  return item?.nome || item?.name;
}

function getSelectedIds(option, index) {
  const key = getOptionKey(option, index);
  const current = selectedByOption.value[key];
  if (isSingleChoice(option)) {
    return current ? [current] : [];
  }

  return Array.isArray(current) ? current : [];
}

function buildGroupOptions(option, index) {
  const selectedIds = getSelectedIds(option, index);
  const maxChoices = Number(option?.max_choices);
  const hasMaxChoices = Number.isFinite(maxChoices) && maxChoices > 0;
  const maxReached = !isSingleChoice(option) && hasMaxChoices && selectedIds.length >= maxChoices;

  return (option?.items || []).map((item, itemIndex) => {
    const itemId = String(item?.id ?? item?.codigo ?? `item-${itemIndex}`);
    const isSelected = selectedIds.includes(itemId);

    return {
      label: itemLabel(item),
      value: itemId,
      disable: item?.is_active === false || (!isSelected && maxReached),
      item,
    };
  });
}

function validateSelections() {
  for (let index = 0; index < optionGroups.value.length; index += 1) {
    const option = optionGroups.value[index];
    const selectedIds = getSelectedIds(option, index);
    const minChoices = Number(option?.min_choices);
    const maxChoices = Number(option?.max_choices);

    if (option?.required && selectedIds.length === 0) {
      return `O grupo \"${option?.nome || index + 1}\" é obrigatório.`;
    }

    if (Number.isFinite(minChoices) && minChoices > 0 && selectedIds.length < minChoices) {
      return `Selecione pelo menos ${minChoices} item(ns) em \"${option?.nome || index + 1}\".`;
    }

    if (Number.isFinite(maxChoices) && maxChoices > 0 && selectedIds.length > maxChoices) {
      return `Selecione no máximo ${maxChoices} item(ns) em \"${option?.nome || index + 1}\".`;
    }
  }

  return null;
}

function buildSelectionPayload() {
  const groups = optionGroups.value.map((option, optionIndex) => {
    const optionId = getOptionKey(option, optionIndex);
    const selectedIds = getSelectedIds(option, optionIndex);
    const selectedItems = (option?.items || [])
      .filter((item, itemIndex) => {
        const itemId = String(item?.id ?? item?.codigo ?? `item-${itemIndex}`);
        return selectedIds.includes(itemId);
      })
      .map((item) => ({
        ...item,
        option_id: optionId,
        option_name: option?.nome || option?.name || null,
      }));

    return {
      option_id: optionId,
      option_name: option?.nome || option?.name || null,
      selected_item_ids: selectedIds,
      selected_items: selectedItems,
    };
  });

  const flat = groups.flatMap((group) => group.selected_items);

  return { groups, flat };
}

function confirmAddWithAddons() {
  const validationError = validateSelections();
  if (validationError) {
    $q.notify({
      type: "negative",
      message: validationError,
      position: "top",
    });
    return;
  }

  const selection = buildSelectionPayload();

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
