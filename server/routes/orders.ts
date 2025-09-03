import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth } from '../auth';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  customer_id: z.string().uuid().optional(),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(1),
  customer_email: z.string().email().optional(),
  delivery_address: z.string().min(1),
  status: z.enum(['pending', 'cooking', 'out_for_delivery', 'delivered', 'cancelled']).default('pending'),
  total: z.number().min(0),
  items: z.array(z.object({
    inventory_item_id: z.string().uuid(),
    qty: z.number().min(1),
    price: z.number().min(0)
  })),
  special_instructions: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'online']).default('cash')
});

// Get all orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT o.*, 
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'inventory_item_id', oi.inventory_item_id,
                  'qty', oi.qty,
                  'price', oi.price
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create order
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Create order
      const orderResult = await query(
        `INSERT INTO orders (customer_id, customer_name, customer_phone, customer_email, 
                           delivery_address, status, total, special_instructions, payment_method)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          validatedData.customer_id || null,
          validatedData.customer_name,
          validatedData.customer_phone,
          validatedData.customer_email || null,
          validatedData.delivery_address,
          validatedData.status,
          validatedData.total,
          validatedData.special_instructions || null,
          validatedData.payment_method
        ]
      );

      const order = orderResult.rows[0];

      // Create order items
      for (const item of validatedData.items) {
        await query(
          `INSERT INTO order_items (order_id, inventory_item_id, qty, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.inventory_item_id, item.qty, item.price]
        );
      }

      await query('COMMIT');
      
      // Fetch complete order with items
      const completeOrderResult = await query(
        `SELECT o.*, 
                json_agg(
                  json_build_object(
                    'id', oi.id,
                    'inventory_item_id', oi.inventory_item_id,
                    'qty', oi.qty,
                    'price', oi.price
                  )
                ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.id = $1
         GROUP BY o.id`,
        [order.id]
      );

      res.status(201).json(completeOrderResult.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update order status
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'cooking', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;