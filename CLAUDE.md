# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**express-rest-api-learning** is an educational REST API for managing tasks built with Express.js. Data is persisted to a local SQLite database via `better-sqlite3` (see [State & Persistence](#state--persistence)). A React frontend (in `client/`) consumes this API and is served by Express in production (see [Frontend](#frontend)). The project demonstrates proper structure and Claude Code workflow best practices.

## Quick Start

```bash
npm install       # Install backend dependencies
npm start         # Run server (port 3000) — serves the API and, in production, the built frontend
npm run dev       # Run backend with auto-reload on file changes

cd client && npm install   # Install frontend dependencies (separate package.json)
npm run dev                 # Vite dev server with HMR, proxies /api/* to :3000 (no CORS needed)
npm run build                # Build frontend into ../public (served by Express — see Frontend)
```

## Coding Standards

Async/await only (no `.then()` chains), naming conventions (kebab-case files, camelCase
vars/functions, `UPPER_SNAKE_CASE` constants, English technical names with Portuguese-only
comments/messages, and the `PascalCase` exception for React components), and comment
discipline (WHY not WHAT) are documented in `.claude/rules/coding-standards.md`.

## Project Structure

```
express-rest-api-learning/
├── app.js                     # Express app initialization, middleware setup, route mounting,
│                               # static frontend serving in production (see Frontend)
├── server.js                  # Starts the HTTP server (app.listen); imports app.js
├── package.json                # Backend dependencies and scripts
├── client/                    # React + Vite frontend source (own package.json, own node_modules)
│   └── src/                   # Conventions documented in .claude/rules/frontend.md
├── public/                    # Frontend build output (gitignored), served by Express in production
├── routes/
│   └── task-routes.js         # HTTP route definitions (GET, POST, PUT, PATCH, DELETE)
├── controllers/
│   └── task-controller.js     # Request/response handling, calls services
├── services/
│   ├── db.js                  # SQLite connection setup and table creation
│   └── task-service.js        # SQL queries via better-sqlite3
├── middleware/                 # Optional: custom middleware functions
│   └── error-handler.js       # Global error handling
├── utils/
│   └── validators.js          # Input validation helpers
├── tests/                     # Jest test suite (npm test)
├── audits/                    # Reports produced by the auditor subagent
├── .gitignore
├── README.md                  # User-facing documentation (Portuguese OK)
├── CLAUDE.md                  # This file
├── API.md                     # Full endpoint documentation
└── teste.http                 # REST Client test file
```

### Folder Responsibilities

- **routes/** — Map HTTP methods to controller functions. No business logic. Only request validation, routing, and response sending.
- **controllers/** — Handle request/response cycle. Call services/models, format responses, set HTTP status codes. Keep logic minimal.
- **services/** — Reusable business logic (data operations, calculations, validations). Can be used by multiple controllers.
- **middleware/** — Request processing (auth, logging, error handling). Applied globally or to specific routes.
- **utils/** — Pure helper functions (validators, formatters, calculations). No side effects.
- **client/** — React frontend source. Talks to the backend only through the REST API in @API.md, never touches SQLite directly. Own conventions in `.claude/rules/frontend.md`.
- **public/** — Build output of `client/` (via `npm run build`). Not source — never edit directly; regenerated on every build.

## Architecture

Layered architecture with separation of concerns:

1. **app.js** — Express app initialization, middleware setup, route mounting at `/api/tasks`
2. **server.js** — Starts the HTTP server (`app.listen`); kept separate from `app.js` so the app
   can be imported directly in tests (see [State & Persistence](#state--persistence) note on
   `services/db.js` for the equivalent separation on the data side)
3. **routes/task-routes.js** — HTTP route definitions, maps verbs to controller methods
4. **controllers/task-controller.js** — Request/response handling, calls services
5. **Data Layer** — `services/task-service.js` runs SQL queries via `better-sqlite3` against a
   local `tasks.db` file; `services/db.js` owns the connection and table setup (see
   [State & Persistence](#state--persistence))
6. **Frontend serving** — `app.js` serves the built frontend from `public/` via `express.static`
   plus a fallback route to `index.html` for client-side routing, replacing the current JSON
   welcome message at `GET /` (see [Frontend](#frontend))

## Frontend

React + Vite SPA in `client/`. It consumes the REST API documented in @API.md and never
touches SQLite directly — client-side validation in `client/src` mirrors the backend rules
in `.claude/rules/api-design.md` but the backend remains the source of truth (the API still
re-validates and rejects on its own).

In development, Vite's dev server proxies `/api/*` to Express (port 3000) for HMR, so the
browser only ever talks to one origin — **no CORS is configured or needed**, and none should
be added without revisiting this decision. In production, `npm run build` (inside `client/`)
outputs to `public/`, which `app.js` serves as static files (see [Architecture](#architecture)).

Commands: see [Quick Start](#quick-start). Structure, naming, and component conventions:
see `.claude/rules/frontend.md` (kept out of this file to stay under the project's own
200-line budget for CLAUDE.md).

## Data Model

Tasks stored with auto-incrementing IDs. This is an illustrative snapshot, not the exhaustive
field list — @API.md's own "Data Model" section is the authoritative, always-current source:

```javascript
{
  id: number,
  title: string,              // required, user-facing name can be "título"
  description: string,        // optional, defaults to ''
  isCompleted: boolean,       // optional, defaults to false
  dueDate: ISO8601 string     // optional, defaults to null
  priority: string            // optional, one of 'low' | 'medium' | 'high', defaults to null
  tags: string[]              // optional, array of strings max 10 items, each max 50 chars, defaults to []
  createdAt: ISO8601 string   // auto-set on creation
}
```

## API Design & Business Rules

API design conventions (business rules, error responses, HTTP status codes) are documented in `.claude/rules/api-design.md`.

## REST Endpoints

Consulte @API.md para a documentação completa de todos os endpoints.

## Adding Features

### New Endpoint
Use a Skill `/add-endpoint`, que automatiza criação de rota, controller, 
validação e documentação em API.md seguindo os padrões deste projeto.

### New Task Field
Use a Skill `/add-field`, que automatiza atualização do Data Model, 
validação e documentação em API.md.

### New Middleware
1. Create file in `middleware/` with kebab-case name
2. Export function that takes `(req, res, next)`
3. Mount in `server.js` or specific routes

## Testing

**Automated tests (Jest)**
- Run: `npm test`
- Suite lives in `tests/` (`app.js` exports the Express app without calling `.listen()` so
  routes can be tested directly via `supertest`; `services/db.js` is mocked with an in-memory
  SQLite instance in route-level tests, never the real `tasks.db`)

**REST Client (VS Code extension)**
- File: `teste.http` has snippets for all endpoints
- Run: `npm start` then click "Send Request"

**Manual curl testing**
- See README.md for examples
- Use `node --watch server.js` for auto-reload during development

## State & Persistence

Data is persisted to a local SQLite database (`tasks.db`, gitignored) via `better-sqlite3`.
Connection setup and table creation live in `services/db.js`; `services/task-service.js`
runs real SQL queries instead of mutating an in-memory array.

`better-sqlite3` is fully synchronous, so `task-service.js` methods stay synchronous
functions (no `async`/`await`) — there is no asynchronous I/O to await. Controllers call
them exactly as before.

The MCP `sqlite` server configured in `.mcp.json` points at the same `tasks.db` file. It
exists only so Claude Code can inspect/query the database directly during development —
it is not part of the app's runtime request path.

`.mcp.json` also configures a `github` MCP server, used to read and manage issues/PRs on
the project's GitHub repository (e.g. the `test-writer` subagent calls
`mcp__github__get_issue` to pull issue context when writing tests). Like `sqlite`, it is a
development-time tool only and is not part of the app's runtime request path.
