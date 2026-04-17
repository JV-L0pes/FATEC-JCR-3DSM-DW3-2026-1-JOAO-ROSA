import { Router, Request, Response } from 'express';
import { Task } from '../models/Task';

const router = Router();

/**
 * PUT /api/tasks/:id — atualização completa (REST).
 * Exige body com title (string) e completed (boolean).
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, completed } = req.body;

    if (title === undefined || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        error: 'PUT exige substituição completa: envie "title" (string não vazia).',
      });
    }
    if (completed === undefined || typeof completed !== 'boolean') {
      return res.status(400).json({
        error: 'PUT exige substituição completa: envie "completed" (boolean).',
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title: title.trim(), completed },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    return res.json(task);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar tarefa.' });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar tarefas.' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, completed = false } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Título é obrigatório.' });
    }
    const task = new Task({
      title: title.trim(),
      completed: Boolean(completed),
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tarefa.' });
  }
});

export default router;
