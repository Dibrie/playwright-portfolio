import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

// GET /api/transactions/summary  (must be before /:id)
router.get('/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // All-time balance
    const balanceResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
       FROM transactions WHERE user_id = $1`,
      [userId]
    );

    // Current month
    const monthResult = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS month_income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS month_expenses
       FROM transactions
       WHERE user_id = $1
         AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)`,
      [userId]
    );

    // By category for current month (expenses only)
    const categoryResult = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = $1
         AND type = 'expense'
         AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
       GROUP BY category
       ORDER BY total DESC`,
      [userId]
    );

    const totalIncome = parseFloat(balanceResult.rows[0].total_income);
    const totalExpenses = parseFloat(balanceResult.rows[0].total_expenses);
    const monthIncome = parseFloat(monthResult.rows[0].month_income);
    const monthExpenses = parseFloat(monthResult.rows[0].month_expenses);

    res.json({
      balance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      monthIncome,
      monthExpenses,
      categoryBreakdown: categoryResult.rows.map((r) => ({
        category: r.category,
        total: parseFloat(r.total),
      })),
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/transactions
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const {
    search,
    startDate,
    endDate,
    category,
    type,
    minAmount,
    maxAmount,
    sortBy = 'date',
    sortDir = 'desc',
    page = '1',
    limit = '10',
  } = req.query as Record<string, string>;

  const conditions: string[] = ['user_id = $1'];
  const params: (string | number)[] = [userId];
  let idx = 2;

  if (search) {
    conditions.push(`description ILIKE $${idx}`);
    params.push(`%${search}%`);
    idx++;
  }
  if (startDate) {
    conditions.push(`date >= $${idx}`);
    params.push(startDate);
    idx++;
  }
  if (endDate) {
    conditions.push(`date <= $${idx}`);
    params.push(endDate);
    idx++;
  }
  if (category) {
    const cats = category.split(',').map((c) => c.trim()).filter(Boolean);
    if (cats.length > 0) {
      conditions.push(`category = ANY($${idx})`);
      params.push(cats as unknown as string);
      idx++;
    }
  }
  if (type && type !== 'all') {
    conditions.push(`type = $${idx}`);
    params.push(type);
    idx++;
  }
  if (minAmount) {
    conditions.push(`amount >= $${idx}`);
    params.push(parseFloat(minAmount));
    idx++;
  }
  if (maxAmount) {
    conditions.push(`amount <= $${idx}`);
    params.push(parseFloat(maxAmount));
    idx++;
  }

  const allowedSortBy: Record<string, string> = {
    date: 'date',
    amount: 'amount',
    description: 'description',
    category: 'category',
    created_at: 'created_at',
  };
  const allowedSortDir = ['asc', 'desc'];
  const safeSortBy = allowedSortBy[sortBy] || 'date';
  const safeSortDir = allowedSortDir.includes(sortDir) ? sortDir : 'desc';

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const where = `WHERE ${conditions.join(' AND ')}`;

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT id, description, amount, type, category, date, notes, created_at
       FROM transactions ${where}
       ORDER BY ${safeSortBy} ${safeSortDir}, created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limitNum, offset]
    );

    res.json({
      transactions: dataResult.rows.map((r) => ({
        id: r.id,
        description: r.description,
        amount: parseFloat(r.amount),
        type: r.type,
        category: r.category,
        date: r.date,
        notes: r.notes,
        createdAt: r.created_at,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/transactions
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { description, amount, type, category, date, notes } = req.body;

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    res.status(400).json({ error: 'Description is required', field: 'description' });
    return;
  }
  if (description.length > 100) {
    res.status(400).json({ error: 'Description must be 100 characters or fewer', field: 'description' });
    return;
  }
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    res.status(400).json({ error: 'Amount must be a positive number', field: 'amount' });
    return;
  }
  const roundedAmount = Math.round(parseFloat(amount) * 100) / 100;
  if (!type || !['income', 'expense'].includes(type)) {
    res.status(400).json({ error: 'Type must be income or expense', field: 'type' });
    return;
  }
  if (!category || typeof category !== 'string') {
    res.status(400).json({ error: 'Category is required', field: 'category' });
    return;
  }
  if (!date || typeof date !== 'string') {
    res.status(400).json({ error: 'Date is required', field: 'date' });
    return;
  }
  const txnDate = new Date(date);
  if (isNaN(txnDate.getTime())) {
    res.status(400).json({ error: 'Invalid date', field: 'date' });
    return;
  }
  if (txnDate > new Date()) {
    res.status(400).json({ error: 'Date cannot be in the future', field: 'date' });
    return;
  }
  if (notes && notes.length > 500) {
    res.status(400).json({ error: 'Notes must be 500 characters or fewer', field: 'notes' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO transactions (user_id, description, amount, type, category, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, description, amount, type, category, date, notes, created_at`,
      [userId, description.trim(), roundedAmount, type, category, date, notes || null]
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id,
      description: r.description,
      amount: parseFloat(r.amount),
      type: r.type,
      category: r.category,
      date: r.date,
      notes: r.notes,
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await pool.query('SELECT id FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
  if (existing.rows.length === 0) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  const { description, amount, type, category, date, notes } = req.body;

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    res.status(400).json({ error: 'Description is required', field: 'description' });
    return;
  }
  if (description.length > 100) {
    res.status(400).json({ error: 'Description must be 100 characters or fewer', field: 'description' });
    return;
  }
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    res.status(400).json({ error: 'Amount must be a positive number', field: 'amount' });
    return;
  }
  const roundedAmount = Math.round(parseFloat(amount) * 100) / 100;
  if (!type || !['income', 'expense'].includes(type)) {
    res.status(400).json({ error: 'Type must be income or expense', field: 'type' });
    return;
  }
  if (!category) {
    res.status(400).json({ error: 'Category is required', field: 'category' });
    return;
  }
  if (!date) {
    res.status(400).json({ error: 'Date is required', field: 'date' });
    return;
  }
  const txnDate = new Date(date);
  if (txnDate > new Date()) {
    res.status(400).json({ error: 'Date cannot be in the future', field: 'date' });
    return;
  }
  if (notes && notes.length > 500) {
    res.status(400).json({ error: 'Notes must be 500 characters or fewer', field: 'notes' });
    return;
  }

  try {
    const { rows } = await pool.query(
      `UPDATE transactions
       SET description = $1, amount = $2, type = $3, category = $4, date = $5, notes = $6
       WHERE id = $7 AND user_id = $8
       RETURNING id, description, amount, type, category, date, notes, created_at`,
      [description.trim(), roundedAmount, type, category, date, notes || null, id, userId]
    );
    const r = rows[0];
    res.json({
      id: r.id,
      description: r.description,
      amount: parseFloat(r.amount),
      type: r.type,
      category: r.category,
      date: r.date,
      notes: r.notes,
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (rowCount === 0) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
