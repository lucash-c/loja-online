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

test("menuNormalizer cobre sum/highest/average + aliases single/multiple", () => {
  assert.equal(normalizeOption({ type: "sum" }).type, "sum");
  assert.equal(normalizeOption({ type: "highest" }).type, "highest");
  assert.equal(normalizeOption({ type: "average" }).type, "average");
  assert.equal(normalizeOption({ type: "single" }).type, "highest");
  assert.equal(normalizeOption({ type: "multiple" }).type, "sum");
  assert.equal(normalizeOption({ type: "valor-invalido" }).type, "sum");

  const product = normalizeProduct({
    id: 1,
    name: "Pizza",
    options: [
      {
        id: 10,
        type: "single",
        items: [{ id: 101, name: "Cheddar", is_active: true }],
      },
    ],
  });

  assert.equal(product.options[0].type, "highest");
  assert.equal(product.has_options, true);
});

test("normalizeProduct usa nome da categoria quando category vem como objeto", () => {
  const product = normalizeProduct({
    id: 1,
    name: "Coca-Cola",
    category: { id: "cat-1", name: "Bebidas" },
  });

  assert.equal(product.categoria, "Bebidas");
  assert.equal(product.category_id, "cat-1");
});

test("cart pricing aplica sum, highest, average e aliases", () => {
  const product = {
    id: 1,
    base_price: 10,
    options: [
      { id: "sum", type: "sum" },
      { id: "highest", type: "highest" },
      { id: "average", type: "average" },
      { id: "single", type: "single" },
      { id: "multiple", type: "multiple" },
    ],
  };

  const options = [
    { option_id: "sum", item_id: "1", price: 2 },
    { option_id: "sum", item_id: "2", price: 3 },
    { option_id: "highest", item_id: "1", price: 4 },
    { option_id: "highest", item_id: "2", price: 6 },
    { option_id: "average", item_id: "1", price: 5 },
    { option_id: "average", item_id: "2", price: 7 },
    { option_id: "single", item_id: "1", price: 5 },
    { option_id: "single", item_id: "2", price: 11 },
    { option_id: "multiple", item_id: "1", price: 3 },
    { option_id: "multiple", item_id: "2", price: 4 },
  ];

  assert.equal(getOptionsPriceByRule(product, options), 35);
});

test("serializer gera items[].options[] flat com option_* e item_*", () => {
  setActivePinia(createPinia());
  const store = useCartStore();

  store.addItem({ id: 77, name: "Pizza G", base_price: 59.9 }, [
    { option: { id: 10, name: "Borda" }, id: 101, name: "Cheddar", preco: "8" },
  ]);

  const [serialized] = store.serializeItemsForOrder();

  assert.deepEqual(serialized.options, [
    {
      option_id: "10",
      option_name: "Borda",
      item_id: "101",
      item_name: "Cheddar",
      price: 8,
    },
  ]);

  const normalized = normalizeCartItem(
    { id: 1, name: "Produto", base_price: 1 },
    [
      { option_id: "2", item_id: "2", price: 2 },
      { option_id: "1", item_id: "1", price: 1 },
    ]
  );

  assert.deepEqual(
    normalized.options.map((option) => `${option.option_id}:${option.item_id}`),
    ["1:1", "2:2"]
  );
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
