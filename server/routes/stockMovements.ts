import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth } from '../auth';

const router = Router();

// Validation schemas
const createStockMovementSchema = z.object({
  inventory_item_id: z.string().uuid(),
  movement_type: z.enum(['in', 'out']),
  quantity: z.number().min(1),
  reason: z.string().min(1),
  reference_number: z.string().optional(),
  unit_cost: z.number().min(0).default(0),
  total_cost: z.number().min(0).default(0),
  performed_by: z.string().min(1),
  notes: z.string().default(''),
  movement_date: z.string()
});

// Get all stock movements
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM stock_movements ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create stock movement
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = createStockMovementSchema.parse(req.body);
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Create stock movement
      const movementResult = await query(
        `INSERT INTO stock_movements (inventory_item_id, movement_type, quantity, reason, 
                                    reference_number, unit_cost, total_cost, performed_by, notes, movement_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          validatedData.inventory_item_id,
          validatedData.movement_type,
          validatedData.quantity,
          validatedData.reason,
          validatedData.reference_number || null,
          validatedData.unit_cost,
          validatedData.total_cost,
          validatedData.performed_by,
          validatedData.notes,
          validatedData.movement_date
        ]
      );

      // Update inventory levels
      const inventoryResult = await query(
        'SELECT current_stock FROM inventory_items WHERE id = $1',
        [validatedData.inventory_item_id]
      );

      if (inventoryResult.rows.length === 0) {
        throw new Error('Inventory item not found');
      }

      const currentStock = inventoryResult.rows[0].current_stock;
      const newStock = validatedData.movement_type === 'in' 
        ? currentStock + validatedData.quantity
        : Math.max(0, currentStock - validatedData.quantity);

      await query(
        'UPDATE inventory_items SET current_stock = $1, updated_at = NOW() WHERE id = $2',
        [newStock, validatedData.inventory_item_id]
      );

      await query('COMMIT');
      
      res.status(201).json(movementResult.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating stock movement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;