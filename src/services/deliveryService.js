import { getEntregaConfig } from "src/services/menuApi";
import { resolvePublicKey } from "src/services/publicMenuContext";

const DISTANCIA_API_URL =
  "http://yss4sogcw0808kwskw4gg8cg.109.199.124.100.sslip.io/distancia";

/**
 * Calcula a distância entre CEP da loja e do cliente
 */
async function calcularDistancia(cepLoja, cepCliente) {
  const url = `${DISTANCIA_API_URL}?cep1=${cepLoja}&cep2=${cepCliente}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Erro ao calcular distância entre os CEPs");
  }
  const data = await response.json();
  return parseFloat(data.distancia_km);
}

/**
 * Calcula taxa e tempo de entrega/retirada com base nas configurações do backend
 */
export async function calcularEntrega(cepCliente, tipoPedido = "entrega") {
  try {
    const loja = JSON.parse(localStorage.getItem("loja"));
    if (!loja || !loja.cep) {
      throw new Error("CEP da loja não encontrado no localStorage");
    }

    const publicKey = resolvePublicKey();
    const configuracoes = await getEntregaConfig(publicKey);

    const cepLoja = loja.cep;
    let distancia = 0;

    // Calcular distância somente para entregas
    if (tipoPedido === "entrega") {
      distancia = await calcularDistancia(cepLoja, cepCliente);
    }

    // Procurar linha de retirada nas configurações
    const linhaRetirada = configuracoes.find(
      (c) =>
        String(c["distancia-km"]).trim().toLowerCase() === "0"
    );

    // Se for retirada (tipo "retirada" ou distância zero)
    if (tipoPedido === "retirada" || distancia === 0) {
      const tempo = linhaRetirada
        ? parseInt(linhaRetirada["tempo-minutos"]) || 20
        : 20;
      const taxa = linhaRetirada
        ? parseFloat(linhaRetirada["taxa"]) || 0
        : 0;

      return {
        atende: true,
        distancia: 0,
        taxa,
        tempo,
        mensagem: `Retirada disponível — tempo médio ${tempo} min`,
      };
    }

    // Para entrega, calcular taxa e tempo com base nas faixas
    const faixas = configuracoes
      .filter(
        (c) =>
          !isNaN(parseFloat(c["distancia-km"])) &&
          !isNaN(parseFloat(c["taxa"]))
      )
      .map((c) => ({
        distancia: parseFloat(c["distancia-km"]),
        taxa: parseFloat(c["taxa"]),
        tempo: parseInt(c["tempo-minutos"]),
      }))
      .sort((a, b) => a.distancia - b.distancia);

    if (faixas.length === 0) {
      throw new Error("Nenhuma faixa de entrega configurada no backend.");
    }

    const limiteMaximo = faixas[faixas.length - 1].distancia;

    if (distancia > limiteMaximo) {
      return {
        atende: false,
        distancia,
        mensagem: `Infelizmente esta loja não atende a sua região.`,
      };
    }

    const faixa = faixas.find((f) => distancia <= f.distancia);

    if (!faixa) {
      return {
        atende: false,
        distancia,
        mensagem: "Não foi possível determinar a taxa de entrega.",
      };
    }

    return {
      atende: true,
      distancia,
      taxa: faixa.taxa,
      tempo: faixa.tempo,
      mensagem: `Entrega disponível (${distancia.toFixed(
        1
      )} km) — tempo médio ${faixa.tempo} min`,
    };
  } catch (err) {
    console.error("Erro no cálculo da entrega:", err);
    return {
      atende: false,
      mensagem: "Erro ao calcular entrega. Verifique o CEP e tente novamente.",
    };
  }
}
