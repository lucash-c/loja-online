const GOOGLE_SHEETS_ID = '1yJ3Hn7wYZeGc5sagoHeyjmSWd6RittvUaUQ0FDqoA4A';
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv';
const GOOGLE_SHEETS_ADDONS_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv&sheet=adicionais';
const GOOGLE_SHEETS_LOJA_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv&sheet=dados-loja';
const GOOGLE_SHEETS_PROPRIETARIO_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv&sheet=dados-proprietario';
const GOOGLE_SHEETS_PEDIDOS_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv&sheet=pedidos';
const GOOGLE_SHEETS_ENTREGA_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv&sheet=entrega';
const GOOGLE_SHEETS_HORARIOS_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv&sheet=horarios';
const GOOGLE_SHEETS_PRODUTOPEDIDO_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv&sheet=produtos-pedidos';
const GOOGLE_SHEETS_FORMAS_PAGAMENTO_URL = 'https://docs.google.com/spreadsheets/d/'+GOOGLE_SHEETS_ID+'/gviz/tq?tqx=out:csv&sheet=pagamento';


import Papa from "papaparse";

function csvToJson(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  return parsed.data.map((row) => {
    const cleaned = {};
    for (const key in row) {
      if (row.hasOwnProperty(key)) {
        cleaned[key.trim()] = String(row[key]).trim();
      }
    }
    return cleaned;
  });
}


export async function getProducts() {
  try {
    const response = await fetch(GOOGLE_SHEETS_CSV_URL);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da planilha');
    }
    const csvText = await response.text();
    const jsonData = csvToJson(csvText);
    return jsonData;
  } catch (error) {
    console.error('Erro no fetchGoogleSheetData:', error);
    throw error;
  }
}

export async function getAddons() {
  try {
    const response = await fetch(GOOGLE_SHEETS_ADDONS_URL);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados dos adicionais');
    }
    const csvText = await response.text();
    const jsonData = csvToJson(csvText);
    return jsonData;
  } catch (error) {
    console.error('Erro no fetchAddonsData:', error);
    throw error;
  }
}

export async function getLoja() {
  try {
    const response = await fetch(GOOGLE_SHEETS_LOJA_URL);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados da loja');
    }
    const csvText = await response.text();
    const jsonData = csvToJson(csvText);
    return jsonData;
  } catch (error) {
    console.error('Erro no fetchLojaData:', error);
    throw error;
  }
}

export async function getEntregaConfig() {
  try {
    const response = await fetch(GOOGLE_SHEETS_ENTREGA_URL);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados das configurações de entrega');
    }
    const csvText = await response.text();
    const jsonData = csvToJson(csvText);
    return jsonData;
  } catch (error) {
    console.error('Erro no fetchEntregaData:', error);
    throw error;
  }
}

export async function getHorariosConfig() {
  try {
    const response = await fetch(GOOGLE_SHEETS_HORARIOS_URL);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados das configurações de horarios de funcionamento');
    }
    const csvText = await response.text();
    const jsonData = csvToJson(csvText);
    return jsonData;
  } catch (error) {
    console.error('Erro no fetchHorariosData:', error);
    throw error;
  }
}

export async function getFormasPagamento() {
  try {
    const response = await fetch(GOOGLE_SHEETS_FORMAS_PAGAMENTO_URL);
    if (!response.ok) {
      throw new Error('Falha ao buscar dados das Formas de pagamento aceitas pela loja');
    }
    const csvText = await response.text();
    const jsonData = csvToJson(csvText);
    return jsonData;
  } catch (error) {
    console.error('Erro no fetchFormasPagamentoData:', error);
    throw error;
  }
}
