# API REST de Tarefas

Uma API REST simples para gerenciar tarefas, construída com Express.js e utilizando dados em memória.

## Estrutura do Projeto

```
tarefas-api/
├── server.js                      # Arquivo principal - inicia o servidor
├── package.json                   # Dependências do projeto
├── routes/
│   └── tarefas.js                # Definição de rotas da API
└── controllers/
    └── tarefasController.js       # Lógica de negócio para tarefas
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
**POST** `/api/tarefas`

Body (JSON):
```json
{
  "titulo": "Minha tarefa",
  "descricao": "Descrição da tarefa",
  "concluida": false
}
```

Resposta (201 Created):
```json
{
  "id": 1,
  "titulo": "Minha tarefa",
  "descricao": "Descrição da tarefa",
  "concluida": false,
  "dataCriacao": "2026-07-10T10:30:00.000Z"
}
```

### 2. Listar Todas as Tarefas
**GET** `/api/tarefas`

Resposta (200 OK):
```json
[
  {
    "id": 1,
    "titulo": "Minha tarefa",
    "descricao": "Descrição da tarefa",
    "concluida": false,
    "dataCriacao": "2026-07-10T10:30:00.000Z"
  }
]
```

### 3. Buscar Tarefa por ID
**GET** `/api/tarefas/:id`

Resposta (200 OK):
```json
{
  "id": 1,
  "titulo": "Minha tarefa",
  "descricao": "Descrição da tarefa",
  "concluida": false,
  "dataCriacao": "2026-07-10T10:30:00.000Z"
}
```

### 4. Atualizar Tarefa
**PUT** `/api/tarefas/:id`

Body (JSON):
```json
{
  "titulo": "Tarefa atualizada",
  "concluida": true
}
```

Resposta (200 OK):
```json
{
  "id": 1,
  "titulo": "Tarefa atualizada",
  "descricao": "Descrição da tarefa",
  "concluida": true,
  "dataCriacao": "2026-07-10T10:30:00.000Z"
}
```

### 5. Deletar Tarefa
**DELETE** `/api/tarefas/:id`

Resposta (200 OK):
```json
{
  "mensagem": "Tarefa deletada com sucesso",
  "tarefa": {
    "id": 1,
    "titulo": "Minha tarefa",
    "descricao": "Descrição da tarefa",
    "concluida": false,
    "dataCriacao": "2026-07-10T10:30:00.000Z"
  }
}
```

## Testando com cURL

```bash
# Criar tarefa
curl -X POST http://localhost:3000/api/tarefas \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Aprender Express","descricao":"Estudar o framework Express"}'

# Listar tarefas
curl http://localhost:3000/api/tarefas

# Buscar tarefa por ID
curl http://localhost:3000/api/tarefas/1

# Atualizar tarefa
curl -X PUT http://localhost:3000/api/tarefas/1 \
  -H "Content-Type: application/json" \
  -d '{"concluida":true}'

# Deletar tarefa
curl -X DELETE http://localhost:3000/api/tarefas/1
```

## Notas

- Os dados são armazenados em memória (array) e serão perdidos quando o servidor for reiniciado
- Cada tarefa recebe um ID único incrementado automaticamente
- O campo `dataCriacao` é preenchido automaticamente na criação
- Campos opcionais na criação: `descricao` (padrão: '') e `concluida` (padrão: false)
