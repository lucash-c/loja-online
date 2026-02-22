export function getOptionKey(option, index) {
  return String(option?.id ?? `option-${index}`);
}

export function isSingleChoice(option) {
  return String(option?.type || "").toLowerCase() === "single";
}

export function getSelectedIds(selectedByOption, option, index) {
  const key = getOptionKey(option, index);
  const current = selectedByOption[key];

  if (isSingleChoice(option)) {
    return current ? [current] : [];
  }

  return Array.isArray(current) ? current : [];
}

export function validateOptionGroups(optionGroups, selectedByOption) {
  const errors = {};

  optionGroups.forEach((option, index) => {
    const optionKey = getOptionKey(option, index);
    const selectedIds = getSelectedIds(selectedByOption, option, index);
    const minChoices = Number(option?.min_choices);
    const maxChoices = Number(option?.max_choices);

    if (option?.required && selectedIds.length === 0) {
      errors[optionKey] = `Selecione ao menos um item em "${option?.name || index + 1}".`;
      return;
    }

    if (Number.isFinite(minChoices) && minChoices > 0 && selectedIds.length < minChoices) {
      errors[optionKey] = `Selecione pelo menos ${minChoices} item(ns) em "${option?.name || index + 1}".`;
      return;
    }

    if (Number.isFinite(maxChoices) && maxChoices > 0 && selectedIds.length > maxChoices) {
      errors[optionKey] = `Selecione no máximo ${maxChoices} item(ns) em "${option?.name || index + 1}".`;
    }
  });

  return errors;
}

export function buildSelectionPayload(optionGroups, selectedByOption) {
  const groups = optionGroups.map((option, optionIndex) => {
    const optionId = getOptionKey(option, optionIndex);
    const selectedIds = getSelectedIds(selectedByOption, option, optionIndex);
    const selectedItems = (option?.items || [])
      .filter((item, itemIndex) => {
        const itemId = String(item?.id ?? `item-${itemIndex}`);
        return selectedIds.includes(itemId);
      })
      .map((item) => ({
        option_id: optionId,
        item_id: String(item.id),
        name: item.name,
        price: Number(item.price || 0),
      }));

    return {
      option_id: optionId,
      selected_item_ids: selectedIds,
      selected_items: selectedItems,
    };
  });

  return {
    groups,
    flat: groups.flatMap((group) => group.selected_items),
  };
}
