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
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  return newTask;
};

const getAll = () => tasks;

const getById = (id) => findById(id);

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

  return task;
};

const markAsCompleted = (id) => {
  const task = findById(id);

  if (!task) return null;

  task.completed = true;
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
  updateById,
  markAsCompleted,
  deleteById
};
