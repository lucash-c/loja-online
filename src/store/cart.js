import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
  }),
  actions: {
    addItem(product, addons = []) {
      const existingItem = this.items.find(
        (item) =>
          item.codigo === product.codigo &&
          JSON.stringify(item.addons || []) === JSON.stringify(addons)
      );
      if (existingItem) {
        existingItem.quantidade += 1;
      } else {
        this.items.push({
          ...product,
          quantidade: 1,
          addons: addons,
        });
      }
    },
    increaseQty(index) {
      this.items[index].quantidade += 1;
    },
    decreaseQty(index) {
      if (this.items[index].quantidade > 1) {
        this.items[index].quantidade -= 1;
      } else {
        this.items.splice(index, 1);
      }
    },
    clearCart() {
      this.items = [];
    },
  },
});
