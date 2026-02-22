import assert from "node:assert/strict";
import {
  normalizeOption,
  normalizeProduct,
} from "../../src/utils/menuNormalizer.js";
import {
  getOptionsPriceByRule,
  normalizeCartItem,
  useCartStore,
} from "../../src/store/cart.js";
import { normalizeOrderType } from "../../src/services/orderApi.js";
import { createPinia, setActivePinia } from "pinia";
import { groupProductsByCategory } from "../../src/store/products.js";

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

test("normaliza opções no contrato canônico", () => {
  const option = normalizeOption({
    id: 10,
    name: "Sabores",
    type: "single",
    required: true,
    min_choices: 1,
    max_choices: 1,
    created_at: "2025-01-01T10:00:00Z",
    items: [{ id: 101, name: "Cheddar", price: "8" }],
  });

  assert.equal(option.type, "single");
  assert.equal(option.required, true);
  assert.equal(option.min_choices, 1);
  assert.equal(option.max_choices, 1);
  assert.equal(option.created_at, "2025-01-01T10:00:00Z");
  assert.deepEqual(option.items, [
    {
      id: 101,
      name: "Cheddar",
      price: 8,
      is_active: true,
      codigo: 101,
      nome: "Cheddar",
      preco: 8,
      ativo: true,
      categoria: "Outros",
    },
  ]);
});

test("produto sem opções continua compatível", () => {
  const product = normalizeProduct({ id: 1, name: "Coca-Cola", options: [] });

  assert.equal(product.has_options, false);
  assert.deepEqual(product.options, []);
});

test("produto com opção single mantém grupo e itens", () => {
  const product = normalizeProduct({
    id: 1,
    name: "Pizza",
    options: [
      {
        id: 10,
        name: "Borda",
        type: "single",
        required: true,
        min_choices: 1,
        max_choices: 1,
        items: [{ id: 101, name: "Cheddar", price: 8, is_active: true }],
      },
    ],
  });

  assert.equal(product.options[0].type, "single");
  assert.equal(product.has_options, true);
});

test("subtotal soma adicionais selecionados", () => {
  const product = { id: 1, base_price: 10 };
  const options = [
    { option_id: "single", item_id: "1", price: 5 },
    { option_id: "multiple", item_id: "2", price: 4 },
  ];

  assert.equal(getOptionsPriceByRule(product, options), 9);
  const cartItem = normalizeCartItem(product, options);
  assert.equal(cartItem.unit_price, 19);
});

test("serializer gera items[].options[] com contrato novo", () => {
  setActivePinia(createPinia());
  const store = useCartStore();

  store.addItem({ id: 77, name: "Pizza G", base_price: 59.9 }, [
    { option_id: 10, item_id: 101, name: "Cheddar", price: "8" },
  ]);

  const [serialized] = store.serializeItemsForOrder();

  assert.deepEqual(serialized.options, [
    {
      option_id: "10",
      item_id: "101",
      name: "Cheddar",
      price: 8,
    },
  ]);
});

test("groupProductsByCategory usa category.name quando category for objeto", () => {
  const grouped = groupProductsByCategory([
    { id: 1, category: { id: "cat-1", name: "Pratos quentes" } },
  ]);

  assert.deepEqual(Object.keys(grouped), ["PRATOS QUENTES"]);
  assert.equal(grouped["PRATOS QUENTES"][0].id, 1);
});

test("groupProductsByCategory mantém categorias válidas e usa OUTROS só para item sem categoria", () => {
  const grouped = groupProductsByCategory([
    { id: 1, category: { id: "cat-1", name: "Bebidas" } },
    { id: 2, categoria: "" },
  ]);

  assert.deepEqual(Object.keys(grouped), ["BEBIDAS", "OUTROS"]);
  assert.equal(grouped.BEBIDAS.length, 1);
  assert.equal(grouped.OUTROS.length, 1);
});

test("order_type aceita apenas entrega, retirada e local", () => {
  assert.equal(normalizeOrderType("entrega"), "entrega");
  assert.equal(normalizeOrderType(" retirada "), "retirada");
  assert.equal(normalizeOrderType("LOCAL"), "local");
  assert.throws(() => normalizeOrderType("delivery"));
});
