const TYPE_ALIASES = {
  single: 'highest',
  multiple: 'sum',
};

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'sim', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'nao', 'não', 'n'].includes(normalized)) return false;
  }

  return fallback;
}

function normalizeType(type) {
  const normalizedType = String(type || '').trim().toLowerCase();
  const canonicalType = TYPE_ALIASES[normalizedType] || normalizedType;

  if (['sum', 'highest', 'average'].includes(canonicalType)) {
    return canonicalType;
  }

  return 'sum';
}

export function normalizeOptionItem(raw = {}) {
  const id = pickFirst(raw.id, raw.item_id, raw.itemId, raw.codigo, null);
  const name = String(
    pickFirst(raw.name, raw.nome, raw.item_name, raw.itemName, '') || ''
  ).trim();
  const price = toNumber(pickFirst(raw.price, raw.preco, raw.item_price, raw.valor), 0);
  const isActive = toBoolean(
    pickFirst(raw.is_active, raw.active, raw.ativo, raw.item_active),
    true
  );

  return {
    id,
    name,
    price,
    is_active: isActive,
    // aliases legados para evitar quebra no front atual
    codigo: id,
    nome: name,
    preco: price,
    ativo: isActive,
    categoria: pickFirst(raw.categoria, raw.category, raw.category_name, 'Outros'),
  };
}

export function normalizeOption(raw = {}) {
  const itemsRaw = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.itens)
    ? raw.itens
    : [];

  const items = itemsRaw.map((item) => normalizeOptionItem(item));

  const id = pickFirst(raw.id, raw.option_id, raw.optionId, raw.codigo, null);
  const name = String(
    pickFirst(raw.name, raw.nome, raw.option_name, raw.optionName, '') || ''
  ).trim();
  const type = normalizeType(pickFirst(raw.type, raw.tipo));
  const required = toBoolean(pickFirst(raw.required, raw.obrigatorio), false);
  const minChoices = toNullableNumber(pickFirst(raw.min_choices, raw.minChoices, raw.min));
  const maxChoices = toNullableNumber(pickFirst(raw.max_choices, raw.maxChoices, raw.max));

  return {
    id,
    name,
    type,
    required,
    min_choices: minChoices,
    max_choices: maxChoices,
    items,
    // aliases legados
    codigo: id,
    nome: name,
    tipo: type,
    obrigatorio: required,
    minimo: minChoices,
    maximo: maxChoices,
    categoria: pickFirst(raw.categoria, raw.category, raw.category_name, 'Outros'),
  };
}

export function normalizeProduct(raw = {}) {
  const optionsRaw = Array.isArray(raw.options)
    ? raw.options
    : Array.isArray(raw.opcoes)
    ? raw.opcoes
    : Array.isArray(raw.addons)
    ? raw.addons
    : Array.isArray(raw.adicionais)
    ? raw.adicionais
    : [];

  const options = optionsRaw.map((option) =>
    Array.isArray(option?.items) || Array.isArray(option?.itens)
      ? normalizeOption(option)
      : normalizeOption({
          ...option,
          id: pickFirst(option?.option_id, option?.id),
          name: pickFirst(option?.option_name, option?.name, option?.nome),
          items: [option],
        })
  );

  const id = pickFirst(raw.id, raw.product_id, raw.productId, raw.codigo, null);
  const name = String(pickFirst(raw.name, raw.nome, raw.product_name, '') || '').trim();
  const description = String(
    pickFirst(raw.description, raw.descricao, raw.product_description, '') || ''
  ).trim();
  const basePrice = toNumber(pickFirst(raw.base_price, raw.price, raw.preco, raw.valor), 0);
  const categoryId = pickFirst(
    raw.category_id,
    raw.categoryId,
    raw.categoria_id,
    raw.categoriaId,
    raw.category?.id,
    raw.categoria?.id,
    null
  );
  const hasOptions = toBoolean(
    pickFirst(raw.has_options, raw.hasOptions, raw.tem_opcoes),
    options.length > 0
  );
  const isActive = toBoolean(pickFirst(raw.is_active, raw.active, raw.ativo), true);
  const imageUrl = pickFirst(raw.image_url, raw.imageUrl, raw.imagem, raw.image, null);

  return {
    id,
    name,
    description,
    base_price: basePrice,
    price: basePrice,
    category_id: categoryId,
    has_options: hasOptions,
    is_active: isActive,
    image_url: imageUrl,
    options,
    // aliases legados
    codigo: id,
    nome: name,
    descricao: description,
    preco: basePrice,
    categoria_id: categoryId,
    categoria: pickFirst(raw.categoria, raw.category_name, raw.category, 'Outros'),
    tem_opcoes: hasOptions,
    ativo: isActive,
    imagem: imageUrl,
    adicionais: options,
    opcoes: options,
  };
}
