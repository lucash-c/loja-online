import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: []
  }),
  actions: {
    addItem(product) {
      const existing = this.items.find(item => item.codigo === product.codigo)
      if (existing) {
        existing.quantidade++
      } else {
        this.items.push({ ...product, quantidade: 1 })
      }
    },
    removeItem(index) {
      this.items.splice(index, 1)
    },
    increaseQty(index) {
      this.items[index].quantidade++
    },
    decreaseQty(index) {
      if (this.items[index].quantidade > 1) {
        this.items[index].quantidade--
      } else {
        this.removeItem(index)
      }
    },
    clearCart() {
      this.items = []
    }
  }
})
