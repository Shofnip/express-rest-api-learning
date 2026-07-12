# API REST de Tarefas

Uma API REST simples para gerenciar tarefas, construída com Express.js e utilizando dados em memória.

## Estrutura do Projeto

```
express-rest-api-learning/
├── server.js                      # Arquivo principal - inicia o servidor
├── package.json                   # Dependências do projeto
├── routes/
│   └── task-routes.js             # Definição de rotas da API
└── controllers/
    └── task-controller.js         # Lógica de negócio para tarefas
```

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

- Os dados são armazenados em memória (array) e serão perdidos quando o servidor for reiniciado
- Cada tarefa recebe um ID único incrementado automaticamente
- O campo `createdAt` é preenchido automaticamente na criação com timestamp ISO 8601
- Campos opcionais na criação: `description` (padrão: '') e `isCompleted` (padrão: false)
- Consulte CLAUDE.md para regras de negócio completas e padrões de desenvolvimento
