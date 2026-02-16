# Web Vitrine (loja-planilha)

A Quasar Project

## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Lint the files
```bash
yarn lint
# or
npm run lint
```


### Format the files
```bash
yarn format
# or
npm run format
```



### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

1) Padrão de produtos com opções e itens (compatível com o PDV que recebera pedidos deste cardapio online)
Produto
No cadastro de produto, o PDV espera algo nesse padrão:

id

name

description

base_price (ou price)

category_id

has_options (boolean)

is_active

image_url (opcional)

Se has_options = true, o PDV abre o modal de personalização antes de adicionar ao carrinho.

Opção (grupo de escolha)
Cada produto pode ter várias opções (ex.: “Tamanho”, “Borda”, “Extras”):

id

name

type
valores efetivos usados no PDV:

sum = soma todos os itens selecionados

highest = soma só o item mais caro do grupo

average = soma média dos itens do grupo
(alias aceitos: single => highest, multiple => sum)

required (boolean)

min_choices (número ou null)

max_choices (número ou null)

items (array)

Item da opção
Dentro de cada opção:

id

name

price

is_active

No PDV:

item com price > 0 aparece como: Nome (+R$ X,XX)

item inativo é desabilitado para seleção.

Regra de seleção (importantíssimo para padronizar UX)
Se max_choices > 1 (ou vazio): seleção múltipla (checkbox).

Se max_choices = 1: seleção única (radio).

Validações aplicadas:

required

min_choices

max_choices

Como as opções vão no pedido (payload)
Quando item entra no carrinho/pedido, o formato usado é “flat” por seleção:

{
  "product_name": "Pizza G",
  "quantity": 1,
  "unit_price": 59.9,
  "options": [
    {
      "option_id": 10,
      "option_name": "Borda",
      "item_id": 101,
      "item_name": "Cheddar",
      "price": 8
    }
  ]
}
Esse é o melhor formato para ficar 100% compatível com a tela de pedidos/impressão deste projeto.

2) Outros detalhes importantes para este cardápio online
Sim, alguns pontos são críticos:

Autenticação pública da loja

Para criar pedido público: POST /api/orders com header X-LOJA-KEY (public key da loja).

Para menu público: GET /public/menu/:publicKey.

Categorias e produtos públicos

O PDV consulta categoria/produto com public_key.

Produtos inativos (is_active = false) não devem aparecer.

Tipo de pedido

Padronizem order_type como: entrega, retirada, local.

Evita ambiguidade no painel de pedidos.

Entrega

Se pedido for entrega, enviem endereço de forma consistente (delivery_address) e, se possível:

delivery_fee

delivery_distance_km / distance_km

delivery_estimated_time_minutes

Isso melhora cálculo e exibição no PDV.

Status/origem

Pedido novo costuma entrar como aguardando aceite (fluxo da operação).

Podem enviar origin (ex.: "cardapio-online") para facilitar filtro/diagnóstico.

Idempotência (recomendado)

Para evitar pedido duplicado em retry/rede instável, adotem chave idempotente no backend/endpoints transacionais quando possível.


Para não quebrar integração:

Produto sempre com has_options coerente com existência de opções.

Opção sempre com type, required, min_choices, max_choices.

Item de opção sempre com name, price, is_active.

Pedido sempre com:

items[].product_name

items[].quantity

items[].unit_price

items[].options[] no formato flat (option_* + item_* + price)

order_type padronizado.
