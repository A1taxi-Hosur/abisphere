import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth } from '../auth';

const router = Router();

// Validation schemas
const createSupplierSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email(),
  address: z.string().min(1),
  rating: z.number().min(1).max(5).default(5),
  categories: z.array(z.string()).default([]),
  active: z.boolean().default(true)
});

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contact: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  rating: z.number().min(1).max(5).optional(),
  categories: z.array(z.string()).optional(),
  active: z.boolean().optional()
});

// Get all suppliers
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM suppliers ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create supplier
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = createSupplierSchema.parse(req.body);
    
    const result = await query(
      `INSERT INTO suppliers (name, contact, phone, email, address, rating, categories, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        validatedData.name,
        validatedData.contact,
        validatedData.phone || null,
        validatedData.email.toLowerCase(),
        validatedData.address,
        validatedData.rating,
        JSON.stringify(validatedData.categories),
        validatedData.active
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update supplier
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateSupplierSchema.parse(req.body);
    
    const updates = Object.entries(validatedData)
      .filter(([_, value]) => value !== undefined)
      .map(([key], index) => {
        if (key === 'categories') {
          return `categories = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
      })
      .join(', ');
    
    const values = Object.values(validatedData)
      .filter(value => value !== undefined)
      .map(value => {
        if (Array.isArray(value)) {
          return JSON.stringify(value);
        }
        return value;
      });
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const result = await query(
      `UPDATE suppliers SET ${updates}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete supplier
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;