const express = require('express');
const taskController = require('../controllers/task-controller');

const router = express.Router();

router.post('/', taskController.create);
router.get('/', taskController.list);
router.get('/status/:status', taskController.getByStatus);
router.get('/count', taskController.count);
router.get('/:id', taskController.getById);
router.put('/:id', taskController.update);
router.patch('/:id/complete', taskController.markAsCompleted);
router.patch('/:id/due-date', taskController.setDueDate);
router.delete('/:id', taskController.remove);

module.exports = router;
