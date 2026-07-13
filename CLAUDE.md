# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**express-rest-api-learning** is an educational REST API for managing tasks built with Express.js. Data is persisted to a local SQLite database via `better-sqlite3` (see [State & Persistence](#state--persistence)). The project demonstrates proper structure and Claude Code workflow best practices.

## Quick Start

```bash
npm install       # Install dependencies
npm start         # Run server (port 3000)
npm run dev       # Run server with auto-reload on file changes
```

## Coding Standards

### 1. Async/Await Only
- **Always use `async/await`** for asynchronous operations.
- **Never use `.then()` chains** — convert all promise chains to async/await.
- Wrap async functions in try/catch for error handling.

```javascript
// ✅ Good
async function createTask(req, res) {
  try {
    const task = await taskService.save(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// ❌ Bad
function createTask(req, res) {
  taskService.save(req.body)
    .then(task => res.status(201).json(task))
    .catch(error => res.status(400).json({ error: error.message }));
}
```

### 2. Naming Conventions
- **Files & Folders**: Use `kebab-case` (e.g., `task-controller.js`, `task-routes.js`)
- **Variables & Functions**: Use `camelCase` in code (e.g., `taskId`, `createTask()`)
- **Constants**: Use `UPPER_SNAKE_CASE` (e.g., `MAX_TASK_LENGTH`)
- **All technical names in English** — only comments and user-facing messages in Portuguese
- This applies to **every file in the project**, not just source code — database files, config files, scripts, and any other artifact created for the project (e.g., `tasks.db`, not `tarefas.db`)

```javascript
// ✅ Good
// Valida se o título da tarefa está vazio
const isTaskTitleEmpty = (title) => !title || title.trim().length === 0;

// ❌ Bad
const validarTituloTarefa = () => {}; // File/variable name mixing languages
```

### 3. Comments — Only When Really Necessary

**Avoid polluting code with excessive comments.** Write self-documenting code with clear names and logic. Comment only when:
- The **WHY** is non-obvious (e.g., workaround for a browser bug, optimization reason)
- Behavior violates common expectations (e.g., intentional mutation instead of immutability)
- Complex algorithm logic that's not immediately clear from the code

**DO NOT comment:**
- What the code does (clear naming already communicates this)
- How it works (if needed, the code design is unclear — refactor instead)
- Stating the obvious (e.g., `// increment counter`)
- Removed code or historical notes (`// this used to be X`)

```javascript
// ✅ Good: Clear naming, no comment needed
const isTaskCompleted = (task) => task.isCompleted === true;

const validateTaskTitle = (title) => {
  if (!title.trim().length) {
    throw new Error('Title is required');
  }
};

// ✅ Good: Comment explains non-obvious WHY
// Trim whitespace here to prevent edge case where user submits title with only spaces
const sanitizedTitle = title.trim();

// ❌ Bad: Excessive/obvious comments
const isTaskCompleted = (task) => {
  // Check if task is completed
  // Returns true if task.isCompleted is true
  // Returns false otherwise
  return task.isCompleted === true;
};

// ❌ Bad: Comment restates the code
let i = 0; // set i to 0
i++; // increment i
```

**Portuguese in comments:** Yes, if needed. Use Portuguese only in comments and user-facing messages. Variable names, function names, file names remain in English.

## Project Structure

```
express-rest-api-learning/
├── app.js                     # Express app initialization, middleware setup, route mounting
├── server.js                  # Starts the HTTP server (app.listen); imports app.js
├── package.json                # Dependencies and scripts
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
