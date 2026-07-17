---
applies_to:
  - "**/*.js"
  - "**/*.jsx"
---

# Coding Standards

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
- **Exception — React components** (`client/src/**`): use `PascalCase` for component files (e.g. `TaskCard.jsx`), per React convention. Everything else in `client/` (hooks, utils, config) still follows the rules above. Full frontend conventions live in `.claude/rules/frontend.md`.

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
