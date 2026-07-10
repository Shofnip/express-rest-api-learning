const taskService = require('../services/task-service');
const { validateCreateTask, validateUpdateTask, validateDueDate } = require('../utils/validators');

const create = async (req, res) => {
  try {
    const validation = validateCreateTask(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const task = taskService.save(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
};

const list = async (req, res) => {
  try {
    const tasks = taskService.getAll();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar tarefas' });
  }
};

const getById = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = taskService.getById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefa' });
  }
};

const update = async (req, res) => {
  try {
    const validation = validateUpdateTask(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const taskId = parseInt(req.params.id);
    const task = taskService.updateById(taskId, req.body);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
};

const markAsCompleted = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = taskService.markAsCompleted(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao marcar tarefa como concluída' });
  }
};

const setDueDate = async (req, res) => {
  try {
    const validation = validateDueDate(req.body.dueDate);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const taskId = parseInt(req.params.id);
    const task = taskService.setDueDate(taskId, req.body.dueDate);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao definir data de vencimento' });
  }
};

const remove = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const task = taskService.deleteById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json({ message: 'Tarefa deletada com sucesso', task });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
};

module.exports = { create, list, getById, update, markAsCompleted, setDueDate, remove };
