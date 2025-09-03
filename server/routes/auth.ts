import { Router } from 'express';
import { query } from '../db';
import { signJwt, comparePassword, requireAuth } from '../auth';

const router = Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    let user;
    
    if (email) {
      // Login with email
      const result = await query(
        'SELECT * FROM users WHERE email = $1 AND active = true',
        [email.toLowerCase()]
      );
      user = result.rows[0];
    } else if (username) {
      // Login with username
      const result = await query(
        'SELECT * FROM users WHERE username = $1 AND active = true',
        [username]
      );
      user = result.rows[0];
    } else {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = signJwt({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        joinDate: user.created_at,
        isActive: user.active
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const result = await query(
      'SELECT id, email, name, role, phone, created_at, active FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        joinDate: user.created_at,
        isActive: user.active
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;