import { Router, Request, Response } from 'express';
import { ShoppingItem } from '../models/ShoppingItem';

const router = Router();

// GET /api/items - Listar todos os itens
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await ShoppingItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar itens.' });
  }
});

// GET /api/items/:id - Buscar um item por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await ShoppingItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar item.' });
  }
});

// POST /api/items - Criar novo item
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, quantity = 1, unit = 'un', purchased = false } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Nome do item é obrigatório.' });
    }
    const item = new ShoppingItem({
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit: unit || 'un',
      purchased: Boolean(purchased),
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar item.' });
  }
});

// PUT /api/items/:id - Atualizar item
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, quantity, unit, purchased } = req.body;
    const item = await ShoppingItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    if (name !== undefined) item.name = String(name).trim();
    if (quantity !== undefined) item.quantity = Number(quantity) || 1;
    if (unit !== undefined) item.unit = String(unit) || 'un';
    if (purchased !== undefined) item.purchased = Boolean(purchased);
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar item.' });
  }
});

// PATCH /api/items/:id/toggle - Alternar status de comprado
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const item = await ShoppingItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    item.purchased = !item.purchased;
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar item.' });
  }
});

// DELETE /api/items/:id - Remover item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await ShoppingItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item.' });
  }
});

export default router;
