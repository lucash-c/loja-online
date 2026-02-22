# QA checklist - opções no cardápio público

Variável de ambiente de referência no frontend:

- `VITE_PUBLIC_MENU_OPTIONS_SOURCE=legacy|group|hybrid`

## Cenários para validar em cada modo

1. Produto sem opções (`options=[]`) adiciona ao carrinho sem abrir seletor.
2. Produto com opção `single` exige 1 seleção quando `required=true`.
3. Produto com opção `multiple` respeita `min_choices` e `max_choices`.
4. Mensagens de erro por opção aparecem ao tentar prosseguir com seleção inválida.
5. Subtotal do item no carrinho soma preço base + adicionais selecionados.
6. Envio do pedido inclui `items[].options[]` com `option_id`, `item_id`, `name`, `price`.
7. Produtos legado + grupos exibem o mesmo comportamento de seleção.
