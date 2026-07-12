# API REST de Tarefas

Uma API REST para gerenciar tarefas, construída com Express.js e persistência em SQLite (`better-sqlite3`).

## Sobre este projeto

Este projeto é um **objeto de estudo** para aprender, na prática, as funcionalidades do Claude Code — cada etapa introduz um conceito novo (CLAUDE.md, Skills, MCP, Code Intelligence, Subagents, Hooks, etc.) aplicado sobre a mesma API de Tarefas, que vai crescendo em complexidade a cada projeto. O código em si (uma API CRUD de tarefas) é propositalmente simples — o foco de aprendizado está no fluxo de trabalho com o Claude Code, não na API.

### Roadmap — Aprendizado Claude Code

| # | Título do Projeto | Conceito Central | Status |
|---|---|---|---|
| 0 | Fundamentos | Modo interativo vs `-p`, permissões, comandos essenciais (`/init`, `/clear`, `/compact`, `/model`) | ✅ Concluído |
| 1 | CLAUDE.md | Documentar convenções e regras do projeto; CLAUDE.md enxuto (< 200 linhas) + Rules + arquivos externos referenciados | ✅ Concluído |
| 2 | Skills | Criar e instalar Skills (`add-endpoint`, `add-field`) para automatizar workflows repetitivos | ✅ Concluído |
| 3 | MCP | Conectar serviços externos (SQLite para persistência real, GitHub para issues/PRs) | ✅ Concluído |
| 4 | Code Intelligence | Navegação por símbolos e refactor guiado (`completed` para `isCompleted`) | ✅ Concluído |
| 5 | Subagents | Delegar tarefas isoladas — usar a issue "Criar testes automatizados" já reservada | ⏳ Pendente |
| 6 | Hooks | Automação determinística (lint, bloqueio de `.env`, garantir documentação/Skills sincronizadas) | ⏳ Pendente |
| 7 | Agent Teams | Múltiplos agentes coordenados (conecta com Agent View descoberto no Projeto 2) | ⏳ Pendente |
| 8 | Plugins e Marketplaces | Empacotar Skills/Hooks/Subagents; construir MCP server próprio em cima de API existente | ⏳ Pendente |
| - | Etapa paralela | Artifacts (protótipo UI) + Conectores (dados externos), fora do Claude Code | ⏳ Pendente |
| Final | Projeto Integrado | Web app único usando todos os conceitos aprendidos | ⏳ Pendente |

## Estrutura do Projeto

```
tarefas-api/
├── server.js                      # Arquivo principal - inicia o servidor
├── package.json                   # Dependências do projeto
├── routes/
│   └── task-routes.js             # Definição de rotas da API
├── controllers/
│   └── task-controller.js         # Request/response, orquestração
├── services/
│   ├── db.js                      # Conexão SQLite e schema da tabela tasks
│   └── task-service.js            # Lógica de negócio e queries SQL
├── utils/
│   └── validators.js              # Validações de entrada
├── .claude/
│   ├── rules/api-design.md        # Regras de negócio e convenções de API
│   └── skills/                    # Skills add-endpoint e add-field
├── API.md                         # Documentação completa de todos os endpoints
├── CLAUDE.md                      # Guia do projeto para o Claude Code
├── teste.http                     # Requisições de exemplo (REST Client)
└── tasks.db                       # Banco SQLite local (gitignored, criado ao rodar o servidor)
```

## Persistência de Dados

Os dados são armazenados em um banco **SQLite** local (`tasks.db`), via `better-sqlite3` — não são mais mantidos em um array em memória. O arquivo `tasks.db` é criado automaticamente na primeira execução do servidor (schema definido em `services/db.js`) e é ignorado pelo Git (`.gitignore`), já que é um banco de desenvolvimento local.

Isso significa que, diferente de versões anteriores deste projeto:
- Os dados **sobrevivem a reinícios** do servidor (não são mais perdidos a cada restart)
- `services/task-service.js` executa queries SQL reais (`INSERT`/`SELECT`/`UPDATE`/`DELETE`) em vez de manipular um array
- Para resetar os dados de teste, basta apagar o arquivo `tasks.db` (e os arquivos auxiliares `tasks.db-wal`/`tasks.db-shm`, se existirem) — ele é recriado do zero na próxima vez que o servidor subir

## Instalação

1. Instale as dependências:
```bash
npm install
```

## Executando a API

### Modo normal:
```bash
npm start
```

### Modo desenvolvimento (com reload automático):
```bash
npm run dev
```

A API estará disponível em `http://localhost:3000`

## Endpoints

Esta seção cobre o CRUD básico com exemplos rápidos. A API também expõe filtros por status (`GET /status/:status`) e prioridade (`GET /priority/:priority`), contagem (`GET /count`), marcar como concluída (`PATCH /:id/complete`) e definir data de vencimento (`PATCH /:id/due-date`) — **consulte `API.md` para a documentação completa de todos os 10 endpoints**, incluindo parâmetros, respostas de erro e o Data Model completo (`priority`, `tags`, `dueDate`).

### 1. Criar Tarefa
**POST** `/api/tasks`

Body (JSON):
```json
{
  "title": "Minha tarefa",
  "description": "Descrição da tarefa",
  "isCompleted": false
}
```

Resposta (201 Created):
```json
{
  "id": 1,
  "title": "Minha tarefa",
  "description": "Descrição da tarefa",
  "isCompleted": false,
  "dueDate": null,
  "priority": null,
  "tags": [],
  "createdAt": "2026-07-10T10:30:00.000Z"
}
```

### 2. Listar Todas as Tarefas
**GET** `/api/tasks`

Resposta (200 OK):
```json
[
  {
    "id": 1,
    "title": "Minha tarefa",
    "description": "Descrição da tarefa",
    "isCompleted": false,
    "dueDate": null,
    "priority": null,
    "tags": [],
    "createdAt": "2026-07-10T10:30:00.000Z"
  }
]
```

### 3. Buscar Tarefa por ID
**GET** `/api/tasks/:id`

Resposta (200 OK):
```json
{
  "id": 1,
  "title": "Minha tarefa",
  "description": "Descrição da tarefa",
  "isCompleted": false,
  "dueDate": null,
  "priority": null,
  "tags": [],
  "createdAt": "2026-07-10T10:30:00.000Z"
}
```

### 4. Atualizar Tarefa
**PUT** `/api/tasks/:id`

Body (JSON):
```json
{
  "title": "Tarefa atualizada",
  "isCompleted": true
}
```

Resposta (200 OK):
```json
{
  "id": 1,
  "title": "Tarefa atualizada",
  "description": "Descrição da tarefa",
  "isCompleted": true,
  "dueDate": null,
  "priority": null,
  "tags": [],
  "createdAt": "2026-07-10T10:30:00.000Z"
}
```

### 5. Deletar Tarefa
**DELETE** `/api/tasks/:id`

Resposta (200 OK):
```json
{
  "message": "Tarefa deletada com sucesso",
  "task": {
    "id": 1,
    "title": "Minha tarefa",
    "description": "Descrição da tarefa",
    "isCompleted": false,
    "dueDate": null,
    "priority": null,
    "tags": [],
    "createdAt": "2026-07-10T10:30:00.000Z"
  }
}
```

## Testando com cURL

```bash
# Criar tarefa
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Aprender Express","description":"Estudar o framework Express"}'

# Listar tarefas
curl http://localhost:3000/api/tasks

# Buscar tarefa por ID
curl http://localhost:3000/api/tasks/1

# Atualizar tarefa
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"isCompleted":true}'

# Deletar tarefa
curl -X DELETE http://localhost:3000/api/tasks/1
```

## Notas

- Os dados são armazenados em um banco **SQLite** (`tasks.db`, gitignored) e persistem entre reinícios do servidor
- Cada tarefa recebe um ID único auto-incrementado pelo próprio SQLite
- O campo `createdAt` é preenchido automaticamente na criação com timestamp ISO 8601
- Campos opcionais na criação: `description` (padrão: `''`), `isCompleted` (padrão: `false`), `priority` (padrão: `null`), `tags` (padrão: `[]`)
- Consulte `API.md` para a documentação completa de todos os endpoints e `CLAUDE.md` para regras de negócio e padrões de desenvolvimento
