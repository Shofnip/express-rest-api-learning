let tasks = [];
let nextId = 1;

const findById = (id) => tasks.find(t => t.id === id);

const findIndexById = (id) => tasks.findIndex(t => t.id === id);

const save = (taskData) => {
  const newTask = {
    id: nextId++,
    title: taskData.title.trim(),
    description: taskData.description ? taskData.description.trim() : '',
    completed: taskData.completed || false,
    priority: taskData.priority || null,
    tags: taskData.tags || [],
    dueDate: null,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  return newTask;
};

const getAll = () => tasks;

const getById = (id) => findById(id);

const getByStatus = (completed) => tasks.filter(t => t.completed === completed);

const getByPriority = (priority) => tasks.filter(t => t.priority === priority);

const count = (completed) => {
  if (completed === undefined) return tasks.length;
  return getByStatus(completed).length;
};

const updateById = (id, updates) => {
  const task = findById(id);

  if (!task) return null;

  if (updates.title !== undefined) {
    task.title = updates.title.trim();
  }

  if (updates.description !== undefined) {
    task.description = updates.description.trim();
  }

  if (updates.completed !== undefined) {
    task.completed = updates.completed;
  }

  if (updates.priority !== undefined) {
    task.priority = updates.priority;
  }

  if (updates.tags !== undefined) {
    task.tags = updates.tags;
  }

  return task;
};

const markAsCompleted = (id) => {
  const task = findById(id);

  if (!task) return null;

  task.completed = true;
  return task;
};

const setDueDate = (id, dueDate) => {
  const task = findById(id);

  if (!task) return null;

  task.dueDate = dueDate;
  return task;
};

const deleteById = (id) => {
  const index = findIndexById(id);

  if (index === -1) return null;

  const deletedTask = tasks.splice(index, 1);
  return deletedTask[0];
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
