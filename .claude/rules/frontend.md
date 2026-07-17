---
applies_to:
  - client/**
---

# Frontend Conventions (client/)

React + Vite SPA that consumes the REST API documented in @API.md. Structure, naming, and
build/dev commands for everything under `client/`. Backend conventions in the root
`CLAUDE.md` still apply project-wide except where noted below.

## Structure

```
client/
├── index.html
├── package.json               # Frontend-only dependencies (react, vite, vitest, ...)
├── vite.config.js             # Dev server proxy: /api/* → http://localhost:3000; also holds
│                               # the Vitest `test` config block (see Testing below)
├── public/
│   └── favicon.svg            # Static asset served as-is by Vite/Express, not processed by the build
└── src/
    ├── main.jsx                # Entry point, mounts <App />
    ├── App.jsx                 # Top-level layout; routing via react-router-dom (BrowserRouter),
    │                            # currently a single route ("/" → TaskListPage)
    ├── index.css                # Tailwind entrypoint + base body styles, imported by main.jsx
    ├── test-setup.js            # Loads jest-dom matchers for Vitest (see Testing below)
    ├── api/
    │   └── tasks.js             # fetch wrapper for /api/tasks — the only place calling fetch()
    ├── pages/
    │   ├── TaskListPage.jsx     # Task list screen: filters, pagination, opens TaskForm for
    │   │                        # create/edit
    │   └── TaskListPage.test.jsx
    ├── components/
    │   ├── TaskCard.jsx
    │   ├── TaskCard.test.jsx
    │   ├── TaskForm.jsx         # Create/edit dialog. No separate Modal.jsx — the dialog markup
    │   │                        # (overlay, panel, header/footer) lives inline in this file,
    │   │                        # along with small local-only subcomponents (FieldLabel,
    │   │                        # CharCount, ErrorText, ReadOnlyField) defined here rather than
    │   │                        # split into their own files — deliberate, not an oversight:
    │   │                        # they're single-use and trivial enough that fragmenting them
    │   │                        # would cost more (file-hopping) than it buys
    │   ├── TaskForm.test.jsx
    │   ├── Select.jsx
    │   ├── Select.test.jsx
    │   ├── Skeleton.jsx
    │   └── Skeleton.test.jsx
    ├── utils/
    │   ├── validation.js        # validateTask / dueInfo — client-side validation + due-date
    │   │                        # formatting, ported from design/painel-tarefas.jsx
    │   └── validation.test.jsx
    └── theme.js                 # Color/spacing tokens (the `T` object from the prototype)
```

Reference implementation for the component breakdown and visual system:
`design/painel-tarefas.jsx` and `design/DESIGN.md` (prototype used mocked data — swap
`fetchTasks`/`saveTask` for real calls through `src/api/tasks.js`).

## Naming

- **Components**: `PascalCase` filenames matching the exported component (e.g. `TaskCard.jsx`).
  This is the one explicit exception to the root CLAUDE.md's kebab-case rule — it's the React
  ecosystem convention and fighting it buys nothing.
- **Everything else** (hooks, utils, config, the `api/` folder): `camelCase` or `kebab-case`
  file names per the root CLAUDE.md rules — same as the backend.
- **Variables & functions**: `camelCase`, same as backend.
- **All technical names in English** — comments and user-facing text in Portuguese, same rule
  as the backend.

## Data flow & validation

- The frontend has **no persistence of its own** — every read/write goes through the REST API.
  Never query SQLite from the frontend; there is no direct DB access path and none should be
  added.
- All API calls go through `src/api/tasks.js`, using `async`/`await` (never `.then()` chains),
  matching the root CLAUDE.md rule #1. This keeps `fetch()` calls out of components.
- Client-side validation (`validateTask` in `src/utils/validation.js`, ported from
  `design/painel-tarefas.jsx`) mirrors `.claude/rules/api-design.md` for instant feedback, but
  is a UX convenience only — the backend re-validates independently and remains the source of
  truth. Don't let client-side validation drift from the backend rules without updating both.
  The same file also exports `dueInfo`, used by `TaskCard` to format/flag due dates
  (overdue/due-soon/normal).
- API error responses are `{ error: "message in Portuguese" }` (see @API.md) — surface that
  message directly rather than inventing new copy.

## Styling

- Utility classes (Tailwind) for layout/spacing/typography primitives.
- Inline `style` objects for anything theme-driven (colors, per-priority tokens) — sourced from
  the `theme.js` tokens (ported from the `T` object in `design/painel-tarefas.jsx`), not
  hardcoded hex values in components. Same reasoning as the prototype: centralizing tokens
  makes the eventual move to CSS custom properties a find-and-replace, not a rewrite.
- No pure white/black, no saturated colors — see `design/DESIGN.md` §2.1 for the full palette
  and rationale (low visual fatigue for long triage sessions).

## Build & dev commands

Run from `client/` (separate `package.json` from the root):

```bash
npm install       # Install frontend dependencies
npm run dev        # Vite dev server with HMR; proxies /api/* to Express on :3000
npm run build        # Production build, output to ../public (served by Express — see root CLAUDE.md's Frontend section)
```

No CORS is configured on the backend for this dev server — the proxy in `vite.config.js`
handles it. If a future change requires the frontend to call the API from a different origin
(e.g. a second client), that's a real architecture change and should revisit this decision
explicitly rather than silently adding CORS headers.

## Testing

Vitest + React Testing Library, configured in the `test` block of `vite.config.js`
(`environment: 'jsdom'`, `setupFiles: ['./src/test-setup.js']`, `globals: true`).

- Tests are **co-located** with the code they cover — `Foo.jsx` next to `Foo.test.jsx` (e.g.
  `src/components/Select.test.jsx`, `src/components/Skeleton.test.jsx`) — not gathered under a
  separate `tests/` folder like the backend's Jest suite.
- `globals: true` means `describe`/`test`/`expect`/`vi` are available without importing them.
- `src/test-setup.js` only loads `@testing-library/jest-dom` matchers (`toBeInTheDocument()`,
  etc.) — it has no other setup.
- Run from `client/`:

```bash
npm run test        # vitest run — runs the full suite once
```

Or from the repo root: `npm --prefix client run test`.
