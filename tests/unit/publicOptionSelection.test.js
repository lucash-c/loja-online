import assert from "node:assert/strict";
import {
  buildSelectionPayload,
  validateOptionGroups,
} from "../../src/utils/publicOptionSelection.js";

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    throw error;
  }
}

const optionGroups = [
  {
    id: "o1",
    name: "Tamanho",
    type: "single",
    required: true,
    min_choices: 1,
    max_choices: 1,
    items: [
      { id: "i1", name: "Pequena", price: 0 },
      { id: "i2", name: "Grande", price: 5 },
    ],
  },
  {
    id: "o2",
    name: "Extras",
    type: "multiple",
    required: false,
    min_choices: 1,
    max_choices: 2,
    items: [
      { id: "i3", name: "Bacon", price: 3 },
      { id: "i4", name: "Cheddar", price: 4 },
      { id: "i5", name: "Catupiry", price: 5 },
    ],
  },
];

test("bloqueia quando required/min_choices não são atendidos", () => {
  const errors = validateOptionGroups(optionGroups, { o1: null, o2: [] });
  assert.equal(typeof errors.o1, "string");
  assert.equal(typeof errors.o2, "string");
});

test("bloqueia quando max_choices é excedido", () => {
  const errors = validateOptionGroups(optionGroups, {
    o1: "i1",
    o2: ["i3", "i4", "i5"],
  });
  assert.equal(typeof errors.o2, "string");
});

test("monta payload flat com subtotal de adicionais correto", () => {
  const selection = buildSelectionPayload(optionGroups, {
    o1: "i2",
    o2: ["i3", "i4"],
  });

  assert.equal(selection.flat.length, 3);
  assert.deepEqual(selection.flat.map((item) => item.item_id), ["i2", "i3", "i4"]);
  const subtotalAddons = selection.flat.reduce((acc, item) => acc + item.price, 0);
  assert.equal(subtotalAddons, 12);
});
