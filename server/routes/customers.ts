import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth } from '../auth';

const router = Router();

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  addresses: z.array(z.object({
    id: z.string(),
    label: z.string(),
    address: z.string(),
    isDefault: z.boolean()
  })).default([]),
  preferences: z.object({
    favoriteItems: z.array(z.string()).default([]),
    dietaryRestrictions: z.array(z.string()).default([]),
    spiceLevel: z.enum(['mild', 'medium', 'spicy']).default('medium')
  }).default({
    favoriteItems: [],
    dietaryRestrictions: [],
    spiceLevel: 'medium'
  }),
  notes: z.string().default('')
});

// Get all customers
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create customer
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = createCustomerSchema.parse(req.body);
    
    const result = await query(
      `INSERT INTO customers (name, phone, email, addresses, preferences, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        validatedData.name,
        validatedData.phone,
        validatedData.email || null,
        JSON.stringify(validatedData.addresses),
        JSON.stringify(validatedData.preferences),
        validatedData.notes
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update customer
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = createCustomerSchema.partial().parse(req.body);
    
    const updates = Object.entries(validatedData)
      .filter(([_, value]) => value !== undefined)
      .map(([key], index) => {
        if (key === 'addresses' || key === 'preferences') {
          return `${key} = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
      })
      .join(', ');
    
    const values = Object.values(validatedData)
      .filter(value => value !== undefined)
      .map(value => {
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
      });
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const result = await query(
      `UPDATE customers SET ${updates}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;