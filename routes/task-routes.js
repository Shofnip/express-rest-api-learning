const express = require('express');
const taskController = require('../controllers/task-controller');

const router = express.Router();

// Criar nova tarefa
router.post('/', taskController.create);

// Listar todas as tarefas
router.get('/', taskController.list);

// Buscar tarefa por ID
router.get('/:id', taskController.getById);

// Atualizar tarefa
router.put('/:id', taskController.update);

// Deletar tarefa
router.delete('/:id', taskController.remove);

module.exports = router;
