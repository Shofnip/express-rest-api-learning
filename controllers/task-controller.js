const taskService = require('../services/task-service');
const { validateCreateTask, validateUpdateTask, validateDueDate, validateStatus, validateCountStatus, validatePriority, validateId } = require('../utils/validators');

const create = async (req, res) => {
  try {
    const validation = validateCreateTask(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const task = taskService.save(req.body);
    res.status(201).json({...task});
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

const count = async (req, res) => {
  try {
    const { status } = req.query;

    const validation = validateCountStatus(status);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const isCompleted = status === undefined ? undefined : status === 'completed';
    const total = taskService.count(isCompleted);
    res.json({ count: total });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao contar tarefas' });
  }
};

const getByStatus = async (req, res) => {
  try {
    const validation = validateStatus(req.params.status);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const isCompleted = req.params.status === 'completed';
    const tasks = taskService.getByStatus(isCompleted);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas por status' });
  }
};

const getByPriority = async (req, res) => {
  try {
    const validation = validatePriority(req.params.level);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const tasks = taskService.getByPriority(req.params.level);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas por prioridade' });
  }
};

const getById = async (req, res) => {
  try {
    const idValidation = validateId(req.params.id);
    if (!idValidation.isValid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const taskId = Number(req.params.id);

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
    const idValidation = validateId(req.params.id);
    if (!idValidation.isValid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const taskId = Number(req.params.id);

    if (req.body.id !== undefined || req.body.createdAt !== undefined) {
      return res.status(400).json({ error: 'Não é permitido atualizar id ou createdAt.' });
    }

    const validation = validateUpdateTask(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

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
    const idValidation = validateId(req.params.id);
    if (!idValidation.isValid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const taskId = Number(req.params.id);

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
    const idValidation = validateId(req.params.id);
    if (!idValidation.isValid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const taskId = Number(req.params.id);

    const validation = validateDueDate(req.body.dueDate);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

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
    const idValidation = validateId(req.params.id);
    if (!idValidation.isValid) {
      return res.status(400).json({ error: idValidation.error });
    }

    const taskId = Number(req.params.id);

    const task = taskService.deleteById(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json({ message: 'Tarefa deletada com sucesso', task });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
};

module.exports = { create, list, count, getByStatus, getByPriority, getById, update, markAsCompleted, setDueDate, remove };
