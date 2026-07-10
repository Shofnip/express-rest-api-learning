// Armazenamento em memória de tarefas
let tasks = [];
let nextId = 1;

// Cria uma nova tarefa
const create = (req, res) => {
  const { title, description, completed } = req.body;

  // Validação: título é obrigatório
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'O título é obrigatório' });
  }

  // Validação: título máximo de 255 caracteres
  if (title.length > 255) {
    return res.status(400).json({ error: 'O título não pode exceder 255 caracteres' });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    description: description ? description.trim() : '',
    completed: completed || false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
};

// Lista todas as tarefas
const list = (req, res) => {
  res.json(tasks);
};

// Busca uma tarefa por ID
const getById = (req, res) => {
  const { id } = req.params;
  const task = tasks.find(t => t.id === parseInt(id));

  if (!task) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  res.json(task);
};

// Atualiza uma tarefa
const update = (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;

  const task = tasks.find(t => t.id === parseInt(id));

  if (!task) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  // Atualiza apenas os campos fornecidos
  if (title !== undefined) {
    if (title.trim().length === 0) {
      return res.status(400).json({ error: 'O título não pode estar vazio' });
    }
    if (title.length > 255) {
      return res.status(400).json({ error: 'O título não pode exceder 255 caracteres' });
    }
    task.title = title.trim();
  }

  if (description !== undefined) {
    task.description = description.trim();
  }

  if (completed !== undefined) {
    task.completed = completed;
  }

  res.json(task);
};

// Deleta uma tarefa
const remove = (req, res) => {
  const { id } = req.params;
  const index = tasks.findIndex(t => t.id === parseInt(id));

  if (index === -1) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  const deletedTask = tasks.splice(index, 1);
  res.json({ message: 'Tarefa deletada com sucesso', task: deletedTask[0] });
};

module.exports = { create, list, getById, update, remove };
