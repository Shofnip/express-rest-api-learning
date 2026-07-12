const db = require('./db');

const rowToTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  completed: row.completed === 1,
  dueDate: row.due_date,
  priority: row.priority,
  tags: JSON.parse(row.tags),
  createdAt: row.created_at
});

const findById = (id) => {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return row ? rowToTask(row) : undefined;
};

const save = (taskData) => {
  const title = taskData.title.trim();
  const description = taskData.description ? taskData.description.trim() : '';
  const completed = taskData.completed || false;
  const priority = taskData.priority || null;
  const tags = taskData.tags || [];
  const createdAt = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO tasks (title, description, completed, due_date, priority, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, description, completed ? 1 : 0, null, priority, JSON.stringify(tags), createdAt);

  return findById(result.lastInsertRowid);
};

const getAll = () => db.prepare('SELECT * FROM tasks').all().map(rowToTask);

const getById = (id) => findById(id);

const getByStatus = (completed) =>
  db.prepare('SELECT * FROM tasks WHERE completed = ?').all(completed ? 1 : 0).map(rowToTask);

const getByPriority = (priority) =>
  db.prepare('SELECT * FROM tasks WHERE priority = ?').all(priority).map(rowToTask);

const count = (completed) => {
  if (completed === undefined) {
    return db.prepare('SELECT COUNT(*) as total FROM tasks').get().total;
  }

  return db.prepare('SELECT COUNT(*) as total FROM tasks WHERE completed = ?').get(completed ? 1 : 0).total;
};

const updateById = (id, updates) => {
  const task = findById(id);

  if (!task) return null;

  const fields = [];
  const values = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title.trim());
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description.trim());
  }

  if (updates.completed !== undefined) {
    fields.push('completed = ?');
    values.push(updates.completed ? 1 : 0);
  }

  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }

  if (updates.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(updates.tags));
  }

  if (fields.length === 0) return task;

  values.push(id);
  db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return findById(id);
};

const markAsCompleted = (id) => {
  const task = findById(id);

  if (!task) return null;

  db.prepare('UPDATE tasks SET completed = 1 WHERE id = ?').run(id);

  return findById(id);
};

const setDueDate = (id, dueDate) => {
  const task = findById(id);

  if (!task) return null;

  db.prepare('UPDATE tasks SET due_date = ? WHERE id = ?').run(dueDate, id);

  return findById(id);
};

const deleteById = (id) => {
  const task = findById(id);

  if (!task) return null;

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

  return task;
};

module.exports = {
  save,
  getAll,
  getById,
  getByStatus,
  getByPriority,
  count,
  updateById,
  markAsCompleted,
  setDueDate,
  deleteById
};
