import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

// GET /api/profile
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rows } = await pool.query(
      'SELECT id, email, full_name, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const u = rows[0];
    res.json({ id: u.id, email: u.email, fullName: u.full_name, createdAt: u.created_at });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { fullName } = req.body;
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters', field: 'fullName' });
    return;
  }
  try {
    const { rows } = await pool.query(
      'UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name, created_at',
      [fullName.trim(), req.userId]
    );
    const u = rows[0];
    res.json({ id: u.id, email: u.email, fullName: u.full_name, createdAt: u.created_at });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/password
router.put('/password', async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword) {
    res.status(400).json({ error: 'Current password is required', field: 'currentPassword' });
    return;
  }
  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters', field: 'newPassword' });
    return;
  }
  if (!/\d/.test(newPassword)) {
    res.status(400).json({ error: 'New password must contain at least one number', field: 'newPassword' });
    return;
  }
  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match', field: 'confirmPassword' });
    return;
  }

  try {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      res.status(400).json({ error: 'Current password is incorrect', field: 'currentPassword' });
      return;
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/profile
router.delete('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
