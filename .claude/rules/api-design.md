---
applies_to:
  - routes/**/*.js
  - controllers/**/*.js
---

# API Design Conventions

## Business Rules

### Task Creation (POST /api/tasks)
- `title` is required and must be non-empty (trim whitespace)
- `title` max length: 255 characters
- `description` max length: 2000 characters
- `isCompleted` defaults to `false`
- `createdAt` automatically set to current timestamp (ISO 8601)
- `priority` accepted values: `low`, `medium`, `high`; defaults to `null`
- `tags` array of strings, max 10 items, each max 50 characters; defaults to `[]`
- `estimatedHours` number >= 0; defaults to `null`

### Task Updates (PUT /api/tasks/:id)
- All fields are optional; omit to leave unchanged
- Cannot update `id` or `createdAt`
- Task must exist before updating (return 404 if not found)

### Task Deletion (DELETE /api/tasks/:id)
- Task must exist before deletion (return 404 if not found)
- Return deleted task object in response for confirmation

### Task Retrieval (GET endpoints)
- Return 404 when task ID not found
- List endpoint returns empty array if no tasks exist

### Task Due Date (PATCH /api/tasks/:id/due-date)
- Format: ISO 8601 string (ex: `2026-08-15T18:00:00Z`)
- Defaults to `null` on creation
- Any valid date is accepted (past or future)

### Task Priority (optional)
- Accepted values: `low`, `medium`, `high`
- Defaults to `null` on creation (no priority set)
- Invalid values rejected with validation error

### Task Tags (optional)
- Array of strings, maximum 10 tags
- Each tag must be between 1 and 50 characters
- Defaults to `[]` (empty array) on creation
- Invalid format (non-array, too many items, oversized strings) rejected with validation error

### Task Estimated Hours (optional)
- Number, must be >= 0
- Defaults to `null` on creation (no estimate set)
- Non-numeric or negative values rejected with validation error
- Updatable via `PUT /api/tasks/:id`

### Task List Pagination (GET /api/tasks, optional)
- `page`: integer >= 1; defaults to `1`
- `limit`: integer >= 1 and <= 100; defaults to `10`
- Response body is an object (not a bare array): `{ data, page, limit, total, totalPages }`
- `totalPages` is `Math.ceil(total / limit)`
- Invalid `page` or `limit` (non-integer, below minimum, or `limit` above 100) rejected with validation error

## Error Responses

Use consistent format: `{ "error": "message" }` or `{ errors: [{ field: "error" }] }`

### HTTP Status Codes

- **200 OK** — Success on GET (list/detail), PUT, PATCH, DELETE
- **201 Created** — Resource created via POST
- **400 Bad Request** — Validation error (missing/invalid fields)
- **404 Not Found** — Resource not found
- **500 Internal Server Error** — Server error

### Error Messages (in Portuguese)

Always return errors in Portuguese user-facing messages, following existing error message patterns in the codebase.
