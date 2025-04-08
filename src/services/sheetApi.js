import axios from 'axios'

// URL da sua tabela 'produtos_loja' no NocoDB
const API_URL = 'http://149.28.97.23:4010/api/v1/db/data/noco/Getting%20Started/produtos_loja'

// Token gerado no painel do NocoDB
const TOKEN = "CJBJzB54-xo0xgAwNkABtjbW5b5KqGjHQ8Q8cVME"

export async function getProducts() {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        'xc-token': TOKEN
      }
    })
    console.log(response.data.list)
    return response.data.list
  } catch (error) {
    console.error("Erro ao buscar produtos:", error.response?.data || error)
    return []
  }
}
