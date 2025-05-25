# 🛒 App de Supermercado com Integração de IA

Este módulo apresenta um estudo de caso prático de uso de APIs da OpenAI em um app de supermercado com marketplace. Nele iremos aplicar a integração **agent + embeddings + file upload** para organizar compras com base em **receitas**.

---

## 🎯 Objetivo

Permitir que o usuário:

- Busque produtos previamente cadastrados por diferentes lojas
- Crie carrinhos de compras manualmente
- Interaja com um agente de IA que:
  - Conhece receitas populares
  - Recebe receitas do usuário em formato de PDF
  - Monte carrinhos de compras com base em receitas
  - Mostra a comparação de carrinhos por loja, ranqueando-os com base nos produtos disponíveis e preços

---

## 🧠 Tecnologias e APIs de IA utilizadas

- **Nest JS** – para construção da API
- **Next JS** – para construção do front-end
- **PostgreSQL** – para persistência de dados
  - **PGVector** – para indexação e busca de embeddings
- **OpenAI API** – para integração com o modelo de linguagem
  - **OpenAI Embeddings API** – para vetorização de receitas e produtos
  - **OpenAI File Upload + Responses API** – para permitir leitura contextual de arquivos de receitas
  - **Cosine Similarity Local** – para validar produtos similares na montagem do carrinho

## Diagrama ER

![Diagrama ER](https://www.mermaidchart.com/raw/22c659e3-cd50-4982-9960-3e32b8b287bf?theme=light&version=v0.1&format=svg)

```mermaid
erDiagram
  USER {
    int id PK
    varchar name
    varchar email
    int active_cart_id FK "ref: > Cart.id"
  }

  RECIPE {
    int id PK
    varchar title
    text description
    int user_id FK "ref: > User.id"
    varchar file_id "note: ID do arquivo enviado via OpenAI Files API"
    datetime created_at
  }

  STORE {
    int id PK
    varchar name
  }

  PRODUCT {
    int id PK
    varchar name
    decimal price
    int store_id FK "ref: > Store.id"
    vector embedding "Embedding vetorial gerado com Embeddings API"
  }

  CART {
    int id PK
    int store_id FK "ref: > Store.id"
    int user_id FK "ref: > User.id"
    datetime created_at
    int created_by_action_id FK "ref: > AgentAction.id, note: Se foi sugerido por IA"
  }

  CARTITEM {
    int id PK
    int product_id FK "ref: > Product.id"
    int cart_id FK "ref: > Cart.id"
    int quantity
  }

  CHATSESSION {
    int id PK
    int user_id FK "ref: > User.id"
    datetime created_at
  }

  CHATMESSAGE {
    int id PK
    int chat_session_id FK "ref: > ChatSession.id"
    varchar sender "note: 'user' ou 'assistant'"
    text content
    varchar openai_message_id "note: ID retornado pela OpenAI"
    datetime created_at
  }

  AGENTACTION {
    int id PK
    int chat_message_id FK "ref: > ChatMessage.id"
    varchar type "note: Tipo da ação: create_cart, import_recipe, etc."
    json payload "note: Dados necessários para executar a ação"
    datetime created_at
    datetime confirmed_at
    datetime executed_at
  }

  USER ||--|{ RECIPE : has
  USER ||--|{ CHATSESSION : participates_in
  USER ||--|{ CART : owns
  RECIPE ||--|{ AGENTACTION : added_by
  STORE ||--|{ PRODUCT : offers
  STORE ||--|{ CART : used_in
  CART ||--|{ CARTITEM : contains
  CART ||--o| AGENTACTION : suggested_by
  CHATSESSION ||--|{ CHATMESSAGE : includes
  CHATMESSAGE ||--|{ AGENTACTION : results_in
```