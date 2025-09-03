import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth } from '../auth';

const router = Router();

// Validation schemas
const createInventorySchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  qty: z.number().min(0),
  unit: z.string().min(1),
  cost: z.number().min(0),
  category: z.string().optional(),
  supplier: z.string().optional(),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional()
});

const updateInventorySchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  qty: z.number().min(0).optional(),
  unit: z.string().min(1).optional(),
  cost: z.number().min(0).optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  min_stock: z.number().min(0).optional(),
  max_stock: z.number().min(0).optional()
});

// Get all inventory items
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM inventory_items ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create inventory item
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = createInventorySchema.parse(req.body);
    
    const result = await query(
      `INSERT INTO inventory_items (name, sku, qty, unit, cost, category, supplier, min_stock, max_stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        validatedData.name,
        validatedData.sku || null,
        validatedData.qty,
        validatedData.unit,
        validatedData.cost,
        validatedData.category || null,
        validatedData.supplier || null,
        validatedData.min_stock || 0,
        validatedData.max_stock || 0
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update inventory item
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateInventorySchema.parse(req.body);
    
    const updates = Object.entries(validatedData)
      .filter(([_, value]) => value !== undefined)
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.values(validatedData).filter(value => value !== undefined);
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const result = await query(
      `UPDATE inventory_items SET ${updates} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete inventory item
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM inventory_items WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;