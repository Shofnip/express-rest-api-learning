# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tarefas-api** is a REST API for managing tasks built with Express.js. Data is stored in-memory (no database), making it suitable for prototyping or learning Express fundamentals.

## Quick Start

```bash
npm install       # Install dependencies
npm start         # Run server (port 3000)
npm run dev       # Run server with auto-reload on file changes
```

## Architecture

The project uses a **layered architecture**:

- **server.js** — Express app initialization and middleware setup. Routes are mounted at `/api/tarefas`.
- **routes/tarefas.js** — HTTP route definitions. Maps verbs (POST, GET, PUT, DELETE) to controller methods.
- **controllers/tarefasController.js** — Business logic for CRUD operations. Manages in-memory task array and response formatting.

### Data Model

Tasks are stored in a module-level array (`tarefas`) with auto-incrementing IDs:

```javascript
{
  id: number,
  titulo: string,           // required
  descricao: string,        // optional, defaults to ''
  concluida: boolean,       // optional, defaults to false
  dataCriacao: ISO string   // auto-set on creation
}
```

## CRUD Endpoints

All endpoints use `/api/tarefas` prefix:

- **POST** — Create task. Requires `titulo`; validates non-empty body.
- **GET** (no ID) — List all tasks.
- **GET** `:id` — Fetch task by ID. Returns 404 if not found.
- **PUT** `:id` — Update task (partial updates supported). Omit fields to leave unchanged.
- **DELETE** `:id` — Delete task. Returns deleted object in response.

Standard error responses use `{ erro: "message" }` format with appropriate HTTP status codes (400 for validation, 404 for not found).

## Adding Features

- **New endpoints**: Add route + corresponding controller method. Follow the pattern: extract params from `req`, find/update task, return JSON response.
- **New task fields**: Add to task object in controller, update validation logic if needed.
- **Middleware**: Add to server.js after `app.use(express.json())` to apply globally, or in routes/tarefas.js to scope to `/api/tarefas`.

## Testing

A `teste.http` file provides REST Client snippets for all endpoints (VS Code REST Client extension compatible). Run `npm start` and execute requests via REST Client UI.

For manual testing with curl, see README.md for command examples.

## State & Persistence

Data is ephemeral — stored in module-scope variables and lost on server restart. This is intentional for the current prototype. To add persistence, replace the in-memory array with database queries (e.g., SQLite, PostgreSQL) in the controller layer without changing route signatures.
