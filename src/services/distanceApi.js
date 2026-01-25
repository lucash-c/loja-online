const DISTANCE_API_BASE_URL = 'http://yss4sogcw0808kwskw4gg8cg.109.199.124.100.sslip.io/';

export async function getDistance(cep1, cep2) {
  try {
    const url = `${DISTANCE_API_BASE_URL}/distancia?cep1=${cep1}&cep2=${cep2}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Falha ao buscar a distância entre os CEPs');
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Erro ao buscar a distância:', error);
    throw error;
  }
}
