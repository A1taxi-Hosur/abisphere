import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { requireAuth, hashPassword } from '../auth';

const router = Router();

// Validation schemas
const createStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'kitchen_staff', 'inventory_manager', 'delivery_staff']),
  phone: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
  salary: z.number().min(0).optional(),
  department: z.string().optional(),
  active: z.boolean().default(true)
});

const updateStaffSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['admin', 'kitchen_staff', 'inventory_manager', 'delivery_staff']).optional(),
  phone: z.string().min(1).optional(),
  salary: z.number().min(0).optional(),
  department: z.string().optional(),
  active: z.boolean().optional()
});

// Get all staff members
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, phone, salary, department, active, created_at FROM staff_members ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create staff member
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = createStaffSchema.parse(req.body);
    
    // Hash password
    const passwordHash = await hashPassword(validatedData.password);
    
    // Create user account
    const userResult = await query(
      `INSERT INTO users (email, password_hash, name, role, phone, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        validatedData.email.toLowerCase(),
        passwordHash,
        validatedData.name,
        validatedData.role,
        validatedData.phone,
        validatedData.active
      ]
    );

    // Create staff member record
    const staffResult = await query(
      `INSERT INTO staff_members (id, email, name, role, phone, salary, department, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userResult.rows[0].id,
        validatedData.email.toLowerCase(),
        validatedData.name,
        validatedData.role,
        validatedData.phone,
        validatedData.salary || 25000,
        validatedData.department || getDepartmentFromRole(validatedData.role),
        validatedData.active
      ]
    );

    res.status(201).json(staffResult.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating staff member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update staff member
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateStaffSchema.parse(req.body);
    
    const updates = Object.entries(validatedData)
      .filter(([_, value]) => value !== undefined)
      .map(([key], index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.values(validatedData).filter(value => value !== undefined);
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const result = await query(
      `UPDATE staff_members SET ${updates}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating staff member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete staff member
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete from both tables
    await query('BEGIN');
    
    try {
      await query('DELETE FROM staff_members WHERE id = $1', [id]);
      await query('DELETE FROM users WHERE id = $1', [id]);
      
      await query('COMMIT');
      res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

function getDepartmentFromRole(role: string): string {
  switch (role) {
    case 'admin': return 'Management';
    case 'kitchen_staff': return 'Kitchen';
    case 'inventory_manager': return 'Operations';
    case 'delivery_staff': return 'Delivery';
    default: return 'General';
  }
}

export default router;