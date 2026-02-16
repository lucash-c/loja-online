// @deprecated: mantido apenas como ponte de compatibilidade durante migração.
// Todas as leituras agora vêm exclusivamente do backend.
export {
  getProducts,
  getAddons,
  getLoja,
  getEntregaConfig,
  getHorariosConfig,
  getFormasPagamento,
} from 'src/services/backendLegacyApi';
