---
name: add-endpoint
description: Cria um novo endpoint REST na API de tarefas — rota, controller, service (se necessário), validação, async/await e documentação em API.md. Use quando o usuário pedir para adicionar/criar um novo endpoint, rota ou ação da API de tarefas.
when_to_use: Disparar quando o usuário pedir para "adicionar um endpoint", "criar uma rota", "expor uma nova ação da API", ou algo equivalente para este projeto de tarefas.
---

Você vai criar um novo endpoint REST para a API de tarefas seguindo os padrões do projeto.

## Padrões do Projeto

**Estrutura em camadas:**
- `routes/task-routes.js` — Mapeamento HTTP (sem lógica de negócio)
- `controllers/task-controller.js` — Request/response, orquestração
- `services/task-service.js` — Lógica de negócio reutilizável
- `utils/validators.js` — Validações (retorna `{ isValid: boolean, error?: string }`)

**Convenções:**
- Arquivos/pastas: `kebab-case`
- Variáveis/funções: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Nomes técnicos: sempre em inglês
- Mensagens de erro: português
- Sempre `async/await`, nunca `.then()`
- Comentários: só quando o "porquê" não for óbvio

**Respostas de erro:**
```json
{ "error": "mensagem em português" }
```
- HTTP 400: validação/dados inválidos
- HTTP 404: recurso não encontrado
- HTTP 500: erro de servidor

**Data Model (tarefa):**
```javascript
{
  id: number,                    // Auto-incrementado
  title: string,                 // Obrigatório, max 255 chars
  description: string,           // Opcional, max 2000 chars, padrão: ""
  isCompleted: boolean,          // Opcional, padrão: false
  dueDate: ISO8601 string,       // Opcional, padrão: null
  priority: string,              // Opcional: 'low'|'medium'|'high', padrão: null
  tags: string[],                // Opcional, max 10 tags, cada max 50 chars, padrão: []
  estimatedHours: number,        // Opcional, >= 0, padrão: null
  createdAt: ISO8601 string      // Auto-setado, não editável
}
```

## 1. Reunir as informações necessárias

Antes de gerar código, você precisa saber:

1. **Método HTTP** (GET, POST, PUT, PATCH ou DELETE)
2. **Caminho/rota** (ex: `/api/tasks/:id/priority`, sempre com prefixo `/api/tasks`)
3. **O que o endpoint faz** (comportamento, campos, regras)

Se algo estiver faltando, pergunte antes de prosseguir.

## 2. Checklist de implementação (nesta ordem)

1. **Rota** (`routes/task-routes.js`)
   - Mapear verbo HTTP + caminho para função no controller
   - Sem lógica de negócio

2. **Controller** (`controllers/task-controller.js`)
   - Função `async` com `try/catch`
   - Validar `id` de path params com `validateId(req.params.id)` (`utils/validators.js`) — usa regex `^\d+$` sobre a string bruta (não `parseInt`/`isNaN`, que aceitam sufixos não-numéricos como `"7abc"`) e rejeita strings com mais de 15 dígitos (evita perda de precisão ao converter para `Number`)
   - Chamar service para lógica de negócio
   - Responder com HTTP correto (200/201/400/404/500)
   - Erro inesperado: 500 `{ error: 'Erro ao <ação> tarefa' }` (em português)
   - Exportar função em `module.exports`

3. **Service** (`services/task-service.js`)
   - Só se o endpoint precisar executar queries SQL (via `better-sqlite3`) ou aplicar regras além de validação simples
   - Funções recebem `id`/dados, retornam task (via `rowToTask`) ou `null` se não encontrada
   - Exportar função

4. **Validação** (`utils/validators.js`)
   - Função `validateXxx()` retornando `{ isValid: boolean, error?: string }`
   - Mensagens em português, tom consistente com validações existentes
   - Chamar no controller antes do service

5. **Async/await**
   - Toda cadeia usa `async/await`
   - Nunca `.then()`

6. **Documentação** (`API.md`)
   - Nova seção com numeração sequencial
   - Título: `Método /caminho — Descrição curta`
   - Subseções: Parâmetros, Exemplo de Request (curl), Exemplo de Response, Possíveis Respostas de Erro
   - Erros: 400/404/500 conforme aplicável
   - Atualizar tabela de "Códigos de Status HTTP" se necessário

## 3. Depois de implementar

Apresente um resumo: rota, controller, service (se criado), validador (se criado), atualização em API.md, e snippet para `teste.http` (recomendado).
