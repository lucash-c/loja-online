/**
 * @typedef {Object} PublicOptionItem
 * @property {string|number|null} id
 * @property {string} name
 * @property {number} price
 */

/**
 * @typedef {Object} PublicOption
 * @property {string|number|null} id
 * @property {string} name
 * @property {'single'|'multiple'} type
 * @property {boolean} required
 * @property {number} min_choices
 * @property {number|null} max_choices
 * @property {string|null} created_at
 * @property {PublicOptionItem[]} items
 */

/**
 * @typedef {Object} PublicProduct
 * @property {string|number|null} id
 * @property {string} name
 * @property {number} base_price
 * @property {PublicOption[]} options
 */

export {};
