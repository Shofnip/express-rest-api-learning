# API.md - Documentação de Endpoints

Este arquivo documenta todos os endpoints disponíveis na API de Tarefas. Todos os endpoints usam o prefixo `/api/tasks`.

---

## 1. POST /api/tasks — Criar tarefa

Cria uma nova tarefa com os dados fornecidos.

### Parâmetros

**Body (JSON)**
- `title` (string, obrigatório) — Título da tarefa. Máximo 255 caracteres. Será trimado automaticamente.
- `description` (string, opcional) — Descrição da tarefa. Máximo 2000 caracteres. Padrão: string vazia.
- `completed` (boolean, opcional) — Status de conclusão. Padrão: `false`.
- `priority` (string, opcional) — Prioridade da tarefa. Valores aceitos: `low`, `medium` ou `high`. Padrão: `null`.

### Exemplo de Request

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Estudar Express",
    "description": "Aprender conceitos de middleware e roteamento",
    "completed": false,
    "priority": "high"
  }'
```

### Exemplo de Response (201 Created)

```json
{
  "id": 7,
  "title": "Estudar Express",
  "description": "Aprender conceitos de middleware e roteamento",
  "completed": false,
  "dueDate": null,
  "priority": "high",
  "createdAt": "2026-07-10T13:07:32.243Z"
}
```

### Possíveis Respostas de Erro

**400 Bad Request** — Validação falhou
```json
{
  "error": "O título é obrigatório"
}
```

**400 Bad Request** — Título muito longo
```json
{
  "error": "O título não pode exceder 255 caracteres"
}
```

**400 Bad Request** — Descrição muito longa
```json
{
  "error": "A descrição não pode exceder 2000 caracteres"
}
```

**400 Bad Request** — Prioridade inválida
```json
{
  "error": "Prioridade inválida. Use \"low\", \"medium\" ou \"high\"."
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao criar tarefa"
}
```

---

## 2. GET /api/tasks — Listar todas as tarefas

Retorna um array com todas as tarefas armazenadas.

### Parâmetros

Nenhum.

### Exemplo de Request

```bash
curl http://localhost:3000/api/tasks
```

### Exemplo de Response (200 OK)

```json
[
  {
    "id": 1,
    "title": "Aprender Express",
    "description": "",
    "completed": true,
    "dueDate": null,
    "priority": "medium",
    "createdAt": "2026-07-10T13:01:19.172Z"
  },
  {
    "id": 2,
    "title": "Testar endpoints",
    "description": "Verificar funcionamento da API",
    "completed": false,
    "dueDate": "2026-08-15T18:00:00Z",
    "priority": null,
    "createdAt": "2026-07-10T13:02:53.676Z"
  }
]
```

### Possíveis Respostas de Erro

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao listar tarefas"
}
```

---

## 3. GET /api/tasks/status/:status — Listar tarefas por status

Retorna um array com as tarefas filtradas pelo status informado.

### Parâmetros

**Path Parameters**
- `status` (string, obrigatório) — Status para filtrar as tarefas. Valores aceitos: `completed` ou `pending`.

### Exemplo de Request

```bash
curl http://localhost:3000/api/tasks/status/completed
```

### Exemplo de Response (200 OK)

```json
[
  {
    "id": 1,
    "title": "Aprender Express",
    "description": "",
    "completed": true,
    "dueDate": null,
    "priority": "medium",
    "createdAt": "2026-07-10T13:01:19.172Z"
  }
]
```

### Possíveis Respostas de Erro

**400 Bad Request** — Status inválido
```json
{
  "error": "Status inválido. Use \"completed\" ou \"pending\"."
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao buscar tarefas por status"
}
```

---

## 4. GET /api/tasks/:id — Buscar tarefa por ID

Retorna os detalhes de uma tarefa específica pelo seu ID.

### Parâmetros

**Path Parameters**
- `id` (number, obrigatório) — ID da tarefa a ser recuperada.

### Exemplo de Request

```bash
curl http://localhost:3000/api/tasks/7
```

### Exemplo de Response (200 OK)

```json
{
  "id": 7,
  "title": "Estudar Express",
  "description": "Aprender conceitos de middleware",
  "completed": false,
  "dueDate": null,
  "priority": null,
  "createdAt": "2026-07-10T13:07:32.243Z"
}
```

### Possíveis Respostas de Erro

**400 Bad Request** — ID inválido
```json
{
  "error": "ID inválido. Use um número inteiro."
}
```

**404 Not Found** — Tarefa não encontrada
```json
{
  "error": "Tarefa não encontrada"
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao buscar tarefa"
}
```

---

## 5. PUT /api/tasks/:id — Atualizar tarefa

Atualiza parcialmente uma tarefa existente. Apenas os campos fornecidos serão atualizados.

### Parâmetros

**Path Parameters**
- `id` (number, obrigatório) — ID da tarefa a ser atualizada.

**Body (JSON)** — Todos os campos são opcionais
- `title` (string, opcional) — Novo título. Máximo 255 caracteres.
- `description` (string, opcional) — Nova descrição. Máximo 2000 caracteres.
- `completed` (boolean, opcional) — Novo status de conclusão.
- `priority` (string, opcional) — Nova prioridade. Valores aceitos: `low`, `medium` ou `high`.

**Nota:** Os campos `id` e `createdAt` não podem ser atualizados.

### Exemplo de Request

```bash
curl -X PUT http://localhost:3000/api/tasks/7 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Estudar Express - Avançado",
    "completed": true,
    "priority": "low"
  }'
```

### Exemplo de Response (200 OK)

```json
{
  "id": 7,
  "title": "Estudar Express - Avançado",
  "description": "Aprender conceitos de middleware",
  "completed": true,
  "dueDate": null,
  "priority": "low",
  "createdAt": "2026-07-10T13:07:32.243Z"
}
```

### Possíveis Respostas de Erro

**400 Bad Request** — ID inválido
```json
{
  "error": "ID inválido. Use um número inteiro."
}
```

**400 Bad Request** — Tentando atualizar campos imutáveis
```json
{
  "error": "Não é permitido atualizar id ou createdAt."
}
```

**400 Bad Request** — Validação falhou
```json
{
  "error": "O título é obrigatório"
}
```

**400 Bad Request** — Prioridade inválida
```json
{
  "error": "Prioridade inválida. Use \"low\", \"medium\" ou \"high\"."
}
```

**404 Not Found** — Tarefa não encontrada
```json
{
  "error": "Tarefa não encontrada"
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao atualizar tarefa"
}
```

---

## 6. PATCH /api/tasks/:id/complete — Marcar tarefa como concluída

Marca uma tarefa como concluída (define `completed` como `true`). Operação específica, alternativa ao PUT.

### Parâmetros

**Path Parameters**
- `id` (number, obrigatório) — ID da tarefa a ser marcada como concluída.

**Body** — Não requer nenhum parâmetro (pode ser vazio `{}`).

### Exemplo de Request

```bash
curl -X PATCH http://localhost:3000/api/tasks/4/complete \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Exemplo de Response (200 OK)

```json
{
  "id": 4,
  "title": "Aprender Express",
  "description": "Estudar fundamentos",
  "completed": true,
  "dueDate": null,
  "priority": null,
  "createdAt": "2026-07-10T13:01:19.172Z"
}
```

### Possíveis Respostas de Erro

**400 Bad Request** — ID inválido
```json
{
  "error": "ID inválido. Use um número inteiro."
}
```

**404 Not Found** — Tarefa não encontrada
```json
{
  "error": "Tarefa não encontrada"
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao marcar tarefa como concluída"
}
```

---

## 7. PATCH /api/tasks/:id/due-date — Definir data de vencimento

Define a data de vencimento de uma tarefa. O campo `dueDate` é opcional e aceita qualquer data válida em formato ISO 8601.

### Parâmetros

**Path Parameters**
- `id` (number, obrigatório) — ID da tarefa.

**Body (JSON)**
- `dueDate` (string, obrigatório) — Data de vencimento em formato ISO 8601 (ex: `2026-08-15T18:00:00Z`).

### Exemplo de Request

```bash
curl -X PATCH http://localhost:3000/api/tasks/5/due-date \
  -H "Content-Type: application/json" \
  -d '{
    "dueDate": "2026-08-15T18:00:00Z"
  }'
```

### Exemplo de Response (200 OK)

```json
{
  "id": 5,
  "title": "Minha primeira tarefa",
  "description": "",
  "completed": false,
  "createdAt": "2026-07-10T13:02:53.676Z",
  "dueDate": "2026-08-15T18:00:00Z",
  "priority": null
}
```

### Possíveis Respostas de Erro

**400 Bad Request** — ID inválido
```json
{
  "error": "ID inválido. Use um número inteiro."
}
```

**400 Bad Request** — Data inválida
```json
{
  "error": "Data de vencimento inválida. Use formato ISO 8601 (ex: 2026-07-15T10:00:00Z)"
}
```

**400 Bad Request** — Sem data fornecida
```json
{
  "error": "A data de vencimento é obrigatória"
}
```

**404 Not Found** — Tarefa não encontrada
```json
{
  "error": "Tarefa não encontrada"
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao definir data de vencimento"
}
```

---

## 8. DELETE /api/tasks/:id — Deletar tarefa

Remove uma tarefa do sistema e retorna os dados da tarefa deletada como confirmação.

### Parâmetros

**Path Parameters**
- `id` (number, obrigatório) — ID da tarefa a ser deletada.

### Exemplo de Request

```bash
curl -X DELETE http://localhost:3000/api/tasks/6
```

### Exemplo de Response (200 OK)

```json
{
  "message": "Tarefa deletada com sucesso",
  "task": {
    "id": 6,
    "title": "Segunda tarefa",
    "description": "Uma descrição",
    "completed": false,
    "dueDate": null,
    "priority": null,
    "createdAt": "2026-07-10T13:02:53.696Z"
  }
}
```

### Possíveis Respostas de Erro

**400 Bad Request** — ID inválido
```json
{
  "error": "ID inválido. Use um número inteiro."
}
```

**404 Not Found** — Tarefa não encontrada
```json
{
  "error": "Tarefa não encontrada"
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao deletar tarefa"
}
```

---

## 9. GET /api/tasks/count — Contar tarefas

Retorna a quantidade total de tarefas, ou a quantidade filtrada por status através do query parameter `status`.

### Parâmetros

**Query Parameters**
- `status` (string, opcional) — Filtra a contagem por status. Valores aceitos: `completed` ou `pending`. Se omitido, conta todas as tarefas.

### Exemplo de Request

```bash
curl http://localhost:3000/api/tasks/count?status=completed
```

### Exemplo de Response (200 OK)

```json
{
  "count": 3
}
```

### Possíveis Respostas de Erro

**400 Bad Request** — Status inválido
```json
{
  "error": "Status inválido. Use \"completed\" ou \"pending\"."
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao contar tarefas"
}
```

---

## 10. GET /api/tasks/priority/:priority — Listar tarefas por prioridade

Retorna um array com as tarefas filtradas pela prioridade informada.

### Parâmetros

**Path Parameters**
- `priority` (string, obrigatório) — Prioridade para filtrar as tarefas. Valores aceitos: `low`, `medium` ou `high`.

### Exemplo de Request

```bash
curl http://localhost:3000/api/tasks/priority/high
```

### Exemplo de Response (200 OK)

```json
[
  {
    "id": 1,
    "title": "Aprender Express",
    "description": "",
    "completed": true,
    "priority": "high",
    "dueDate": null,
    "createdAt": "2026-07-10T13:01:19.172Z"
  },
  {
    "id": 3,
    "title": "Tarefa urgente",
    "description": "Algo importante",
    "completed": false,
    "priority": "high",
    "dueDate": null,
    "createdAt": "2026-07-10T13:05:00.000Z"
  }
]
```

### Possíveis Respostas de Erro

**400 Bad Request** — Prioridade inválida
```json
{
  "error": "Prioridade inválida. Use \"low\", \"medium\" ou \"high\"."
}
```

**500 Internal Server Error** — Erro do servidor
```json
{
  "error": "Erro ao buscar tarefas por prioridade"
}
```

---

## Códigos de Status HTTP

| Status | Significado | Casos de Uso |
|--------|-------------|-------------|
| **200 OK** | Sucesso | GET (list/detail), PUT, PATCH, DELETE |
| **201 Created** | Recurso criado | POST |
| **400 Bad Request** | Validação falhou | Dados inválidos, campos obrigatórios faltando |
| **404 Not Found** | Recurso não encontrado | ID inexistente |
| **500 Internal Server Error** | Erro do servidor | Exceção não tratada no handler |

---

## Formato de Erro Padronizado

Todos os erros retornam no seguinte formato:

```json
{
  "error": "Mensagem descritiva do erro em português"
}
```

---

## Data Model

Cada tarefa possui a seguinte estrutura:

```javascript
{
  id: number,                    // Auto-incrementado, único
  title: string,                 // Obrigatório, max 255 caracteres
  description: string,           // Opcional, max 2000 caracteres, padrão: ""
  completed: boolean,            // Opcional, padrão: false
  dueDate: string (ISO 8601),   // Opcional, padrão: null (pode ser adicionado via PATCH)
  priority: string,              // Opcional, um de "low" | "medium" | "high", padrão: null
  createdAt: string (ISO 8601)   // Auto-setado, não editável
}
```

---

## Notas Importantes

1. **Trimagem automática**: Os campos `title` e `description` são automaticamente trimados (whitespace removido).
2. **Idempotência**: Os endpoints GET são idempotentes. POST, PUT, PATCH, DELETE podem não ser idempotentes em múltiplas chamadas.
3. **Timestamps**: Todas as datas (`createdAt`, `dueDate`) estão em formato ISO 8601 UTC.
4. **Armazenamento**: Os dados são armazenados em memória e perdidos ao reiniciar o servidor.
5. **IDs**: São auto-incrementados e nunca reutilizados dentro de uma sessão.
