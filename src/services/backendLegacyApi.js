import { getPublicMenu } from 'src/services/menuApi';
import { resolvePublicKey } from 'src/services/publicMenuContext';

function ensurePublicKey(publicKey) {
  return publicKey || resolvePublicKey();
}

async function getMenu(publicKey) {
  const key = ensurePublicKey(publicKey);
  return getPublicMenu(key);
}

export async function getProducts(publicKey) {
  const menu = await getMenu(publicKey);
  return menu.products || [];
}

export async function getAddons(publicKey) {
  const menu = await getMenu(publicKey);
  return menu.addons || [];
}

export async function getLoja(publicKey) {
  const menu = await getMenu(publicKey);
  return menu.loja ? [menu.loja] : [];
}

export async function getEntregaConfig(publicKey) {
  const menu = await getMenu(publicKey);
  return menu.entregaConfig || [];
}

export async function getHorariosConfig(publicKey) {
  const menu = await getMenu(publicKey);
  const horarios = menu.raw?.data?.horarios || menu.raw?.horarios || [];
  return Array.isArray(horarios) ? horarios : [horarios].filter(Boolean);
}

export async function getFormasPagamento(publicKey) {
  const menu = await getMenu(publicKey);
  return menu.formasPagamento || [];
}
