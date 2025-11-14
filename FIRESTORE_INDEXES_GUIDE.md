# Guia de Índices do Firestore - Deluxe Job

## Por que Índices são Importantes?

Índices no Firestore são como um índice de um livro - eles permitem encontrar informações rapidamente sem precisar ler tudo. Sem índices adequados, queries complexas falham ou ficam muito lentas.

## Como Aplicar os Índices

### Opção 1: Via Firebase Console (Recomendado)

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Firestore Database** → **Indexes**
4. Clique em **Add Index** para cada índice abaixo

### Opção 2: Via Firebase CLI (Automático)

\`\`\`bash
# Instale o Firebase CLI
npm install -g firebase-tools

# Faça login
firebase login

# Inicialize o projeto (se ainda não fez)
firebase init firestore

# Deploy dos índices
firebase deploy --only firestore:indexes
\`\`\`

O arquivo `firestore.indexes.json` será usado automaticamente.

---

## Índices Necessários

### 1. Posts - Ordenação por Data
**Coleção:** `posts`  
**Campos:** `createdAt` (DESC)  
**Uso:** Feed principal, listagem de posts

**Por que precisa:**
- Query: `orderBy("createdAt", "desc")`
- Usado em: Feed, perfil de criadoras, explorar

---

### 2. Posts - Por Criadora e Data
**Coleção:** `posts`  
**Campos:** `createdAt` (DESC), `creatorId` (ASC)  
**Uso:** Posts de uma criadora específica ordenados por data

**Por que precisa:**
- Query: `where("creatorId", "==", id) + orderBy("createdAt", "desc")`
- Usado em: Perfil da criadora

---

### 3. Likes - Verificação de Curtida
**Coleção:** `likes`  
**Campos:** `userId` (ASC), `postId` (ASC)  
**Uso:** Verificar se usuário curtiu um post

**Por que precisa:**
- Query: `where("userId", "==", id) + where("postId", "==", id)`
- Usado em: Sistema de curtidas (muito frequente!)

---

### 4. Likes - Stories
**Coleção:** `likes`  
**Campos:** `userId` (ASC), `storyId` (ASC)  
**Uso:** Verificar se usuário curtiu um story

**Por que precisa:**
- Query: `where("userId", "==", id) + where("storyId", "==", id)`
- Usado em: Visualizador de stories

---

### 5. Retweets - Verificação
**Coleção:** `retweets`  
**Campos:** `userId` (ASC), `postId` (ASC)  
**Uso:** Verificar se usuário retweetou um post

**Por que precisa:**
- Query: `where("userId", "==", id) + where("postId", "==", id)`
- Usado em: Sistema de retweets

---

### 6. Notificações - Por Remetente
**Coleção:** `notifications`  
**Campos:** `userId` (ASC), `fromUserId` (ASC)  
**Uso:** Filtrar notificações por quem enviou

**Por que precisa:**
- Query: `where("userId", "==", id) + where("fromUserId", "==", id)`
- Usado em: Limpeza de notificações da plataforma

---

### 7. Notificações - Por Tipo
**Coleção:** `notifications`  
**Campos:** `userId` (ASC), `type` (ASC)  
**Uso:** Filtrar notificações por tipo (follow, like, etc)

**Por que precisa:**
- Query: `where("userId", "==", id) + where("type", "==", "follow")`
- Usado em: Gerenciamento de notificações

---

### 8. XP Tracking - Rastreamento Completo
**Coleção:** `xp_tracking`  
**Campos:** `userId` (ASC), `postId` (ASC), `action` (ASC)  
**Uso:** Verificar se XP já foi dado por uma ação

**Por que precisa:**
- Query: `where("userId", "==", id) + where("postId", "==", id) + where("action", "==", type)`
- Usado em: Sistema de gamificação

---

### 9. Stories - Por Criadora e Expiração
**Coleção:** `stories`  
**Campos:** `creatorId` (ASC), `expiresAt` (DESC)  
**Uso:** Stories ativos de uma criadora

**Por que precisa:**
- Query: `where("creatorId", "==", id) + where("expiresAt", ">", now)`
- Usado em: Perfil da criadora, feed de stories

---

### 10. Stories - Expiração e Data
**Coleção:** `stories`  
**Campos:** `expiresAt` (DESC), `createdAt` (DESC)  
**Uso:** Todos os stories ativos ordenados

**Por que precisa:**
- Query: `where("expiresAt", ">", now) + orderBy("createdAt", "desc")`
- Usado em: Feed de stories no topo

---

### 11. Códigos de Convite - Ativos por Criadora
**Coleção:** `invite_codes`  
**Campos:** `creatorId` (ASC), `isActive` (ASC)  
**Uso:** Códigos ativos de uma criadora

**Por que precisa:**
- Query: `where("creatorId", "==", id) + where("isActive", "==", true)`
- Usado em: Sistema MLM de convites

---

### 12. Mensagens - Por Chat e Data
**Coleção:** `messages`  
**Campos:** `chatId` (ASC), `createdAt` (DESC)  
**Uso:** Mensagens de um chat ordenadas

**Por que precisa:**
- Query: `where("chatId", "==", id) + orderBy("createdAt", "desc")`
- Usado em: Sistema de chat

---

### 13. Chats - Por Participante e Última Mensagem
**Coleção:** `chats`  
**Campos:** `participants` (ARRAY_CONTAINS), `lastMessageAt` (DESC)  
**Uso:** Chats de um usuário ordenados por atividade

**Por que precisa:**
- Query: `where("participants", "array-contains", userId) + orderBy("lastMessageAt", "desc")`
- Usado em: Lista de conversas

---

## Impacto da Performance

### Sem Índices:
- Queries falham com erro: "The query requires an index"
- Queries lentas (1-5 segundos)
- Alto custo de leitura no Firebase

### Com Índices:
- Queries funcionam perfeitamente
- Tempo de resposta: 50-200ms
- Custo otimizado (lê apenas o necessário)

---

## Monitoramento

Após criar os índices, monitore no Firebase Console:

1. **Firestore → Usage**
   - Verifique número de leituras
   - Deve reduzir 50-70% após índices

2. **Firestore → Indexes**
   - Status: "Enabled" (verde)
   - Se "Building": aguarde conclusão

---

## Troubleshooting

### Erro: "The query requires an index"
**Solução:** Clique no link do erro, ele leva direto para criar o índice necessário

### Índice em "Building" por muito tempo
**Solução:** Normal para coleções grandes. Pode levar 30min-2h

### Query ainda lenta após índice
**Solução:** Verifique se está usando `limit()` nas queries

---

## Próximos Passos

Após criar os índices:
1. Teste as queries principais
2. Monitore performance no Firebase Console
3. Ajuste limits conforme necessário
4. Configure alertas de uso

---

**Criado em:** 2025  
**Última atualização:** Janeiro 2025  
**Projeto:** Deluxe Job Platform
