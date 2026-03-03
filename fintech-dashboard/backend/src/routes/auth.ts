import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fintrack_jwt_secret';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

async function storeRefreshToken(userId: string, rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, password, fullName } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required', field: 'email' });
    return;
  }
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({ error: 'Full name must be at least 2 characters', field: 'fullName' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters', field: 'password' });
    return;
  }
  if (!/\d/.test(password)) {
    res.status(400).json({ error: 'Password must contain at least one number', field: 'password' });
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format', field: 'email' });
    return;
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered', field: 'email' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name`,
      [email.toLowerCase(), passwordHash, fullName.trim()]
    );
    const user = rows[0];

    const accessToken = generateAccessToken(user.id);
    const rawRefresh = generateRefreshToken();
    await storeRefreshToken(user.id, rawRefresh);
    setRefreshCookie(res, rawRefresh);

    res.status(201).json({
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.full_name },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, full_name FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(user.id);
    const rawRefresh = generateRefreshToken();
    await storeRefreshToken(user.id, rawRefresh);
    setRefreshCookie(res, rawRefresh);

    res.json({
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.full_name },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const rawToken = req.cookies?.refreshToken;
  if (!rawToken) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
      [tokenHash]
    );
    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }
    const { id: tokenId, user_id: userId } = rows[0];

    // Rotate: revoke old, issue new
    await pool.query('UPDATE refresh_tokens SET revoked = true WHERE id = $1', [tokenId]);
    const newRawRefresh = generateRefreshToken();
    await storeRefreshToken(userId, newRawRefresh);
    setRefreshCookie(res, newRawRefresh);

    const accessToken = generateAccessToken(userId);
    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await pool.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [tokenHash]);
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
