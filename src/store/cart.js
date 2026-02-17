import { defineStore } from "pinia";

export function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function normalizeFlatOption(option = {}) {
  return {
    option_id: String(option?.option_id ?? option?.optionId ?? option?.option?.id ?? ""),
    option_name: option?.option_name ?? option?.optionName ?? option?.option?.name ?? "",
    item_id: String(option?.item_id ?? option?.itemId ?? option?.id ?? option?.codigo ?? ""),
    item_name: option?.item_name ?? option?.itemName ?? option?.nome ?? option?.name ?? "",
    price: toNumber(option?.price ?? option?.preco ?? option?.valor, 0),
  };
}

export function sortFlatOptions(options = []) {
  return [...options].sort((a, b) => {
    const left = `${a.option_id}:${a.item_id}`;
    const right = `${b.option_id}:${b.item_id}`;
    return left.localeCompare(right);
  });
}

export function dedupeKey(productId, options = []) {
  return JSON.stringify({
    product_id: String(productId ?? ""),
    options: sortFlatOptions(options).map((option) => ({
      option_id: String(option.option_id ?? ""),
      item_id: String(option.item_id ?? ""),
      price: toNumber(option.price, 0),
    })),
  });
}

export function getOptionTypeById(product, optionId) {
  const option = (product?.options || []).find(
    (current) => String(current?.id ?? current?.codigo ?? "") === String(optionId ?? "")
  );

  const type = String(option?.type ?? option?.tipo ?? "sum").toLowerCase();
  const canonicalType = { single: "highest", multiple: "sum" }[type] ?? type;

  if (["sum", "highest", "average"].includes(canonicalType)) {
    return canonicalType;
  }

  return "sum";
}

export function getOptionsPriceByRule(product, options = []) {
  const grouped = options.reduce((acc, option) => {
    const key = String(option.option_id ?? "");
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(toNumber(option.price, 0));
    return acc;
  }, {});

  return Object.entries(grouped).reduce((total, [optionId, prices]) => {
    const type = getOptionTypeById(product, optionId);

    if (type === "highest") {
      return total + Math.max(...prices, 0);
    }

    if (type === "average") {
      const sum = prices.reduce((acc, price) => acc + price, 0);
      return total + (prices.length ? sum / prices.length : 0);
    }

    return total + prices.reduce((acc, price) => acc + price, 0);
  }, 0);
}

export function normalizeCartItem(product, rawOptions = []) {
  const normalizedOptions = sortFlatOptions(rawOptions.map((option) => normalizeFlatOption(option)));
  const basePrice = toNumber(product?.base_price ?? product?.price ?? product?.preco, 0);
  const optionsPrice = getOptionsPriceByRule(product, normalizedOptions);

  return {
    product_id: String(product?.id ?? product?.product_id ?? product?.codigo ?? ""),
    product_name: product?.name ?? product?.product_name ?? product?.nome ?? "",
    quantity: 1,
    unit_price: basePrice + optionsPrice,
    image_url: product?.image_url ?? product?.imagem ?? null,
    options: normalizedOptions,
  };
}

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
  }),
  getters: {
    serializedItemsForOrder: (state) =>
      state.items.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: toNumber(item.unit_price, 0),
        options: (item.options || []).map((option) => ({
          option_id: option.option_id,
          option_name: option.option_name,
          item_id: option.item_id,
          item_name: option.item_name,
          price: toNumber(option.price, 0),
        })),
      })),
  },
  actions: {
    addItem(product, options = []) {
      const normalizedItem = normalizeCartItem(product, options);
      const itemKey = dedupeKey(normalizedItem.product_id, normalizedItem.options);

      const existingItem = this.items.find(
        (item) => dedupeKey(item.product_id, item.options) === itemKey
      );

      if (existingItem) {
        existingItem.quantity += 1;
        return;
      }

      this.items.push(normalizedItem);
    },
    increaseQty(index) {
      this.items[index].quantity += 1;
    },
    decreaseQty(index) {
      if (this.items[index].quantity > 1) {
        this.items[index].quantity -= 1;
      } else {
        this.items.splice(index, 1);
      }
    },
    itemSubtotal(item) {
      return toNumber(item?.unit_price, 0) * toNumber(item?.quantity, 0);
    },
    serializeItemsForOrder() {
      return this.serializedItemsForOrder;
    },
    clearCart() {
      this.items = [];
    },
  },
});
