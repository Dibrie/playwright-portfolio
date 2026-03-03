import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

interface SeedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Returns the date string only if the date is not in the future, otherwise null.
function safeDate(year: number, month: number, day: number): string | null {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const d = new Date(year, month - 1, day);
  if (d > today) return null;
  return dateStr(year, month, day);
}

// Returns the last `n` calendar months (inclusive of current month), oldest first.
function getLastMonths(n: number): Array<{ year: number; month: number }> {
  const now = new Date();
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return result;
}

function generateTransactions(): SeedTransaction[] {
  const txns: SeedTransaction[] = [];
  const months = getLastMonths(6);

  for (let idx = 0; idx < months.length; idx++) {
    const { year, month } = months[idx];

    // Helper: push a transaction only if the date is not in the future.
    function push(day: number, data: Omit<SeedTransaction, 'date'>): void {
      const date = safeDate(year, month, day);
      if (date) txns.push({ ...data, date });
    }

    // Salary & rent — 1st
    push(1, { description: 'Monthly Salary — Software Engineer', amount: 5200.00, type: 'income', category: 'Salary', notes: 'Net pay after tax and PRSI' });
    push(1, { description: 'Monthly Rent Payment', amount: 1450.00, type: 'expense', category: 'Rent / Mortgage' });

    // Utilities — 5th and 10th
    push(5,  { description: 'Electricity & Gas Bill', amount: 120.50, type: 'expense', category: 'Utilities' });
    push(10, { description: 'Broadband Internet Subscription', amount: 49.99, type: 'expense', category: 'Utilities' });

    // Transport — 2nd and 15th
    push(2,  { description: 'Monthly Leap Card Top-Up', amount: 100.00, type: 'expense', category: 'Transport' });
    push(15, { description: 'Taxi — Late night', amount: 18.50, type: 'expense', category: 'Transport' });

    // Food & dining
    push(3,  { description: 'Weekly Grocery Shopping — Tesco', amount: 87.40, type: 'expense', category: 'Food & Dining' });
    push(7,  { description: 'Lunch — Café on the Green', amount: 14.50, type: 'expense', category: 'Food & Dining' });
    push(10, { description: 'Weekly Grocery Shopping — Tesco', amount: 92.15, type: 'expense', category: 'Food & Dining' });
    push(14, { description: 'Coffee subscription — Morning delivery', amount: 22.00, type: 'expense', category: 'Food & Dining' });
    push(17, { description: 'Weekly Grocery Shopping — Tesco', amount: 78.65, type: 'expense', category: 'Food & Dining' });
    push(20, { description: 'Dinner out — Klaw Seafood', amount: 68.00, type: 'expense', category: 'Food & Dining', notes: 'Anniversary dinner' });
    push(24, { description: 'Weekly Grocery Shopping — Tesco', amount: 105.30, type: 'expense', category: 'Food & Dining' });

    // Entertainment — 8th and 22nd
    push(8,  { description: 'Netflix Subscription', amount: 15.99, type: 'expense', category: 'Entertainment' });
    push(8,  { description: 'Spotify Premium', amount: 10.99, type: 'expense', category: 'Entertainment' });
    push(22, { description: 'Cinema — Cineworld', amount: 24.00, type: 'expense', category: 'Entertainment' });

    // Healthcare — alternating months (positions 0, 2, 4 = GP; position 1 = pharmacy; position 5 = dental)
    if ([0, 2, 4].includes(idx)) {
      push(12, { description: 'GP Visit', amount: 60.00, type: 'expense', category: 'Healthcare' });
    }
    if (idx === 1) {
      push(18, { description: 'Pharmacy — Prescription', amount: 32.50, type: 'expense', category: 'Healthcare', notes: 'Monthly prescription refill' });
    }
    if (idx === 5) {
      push(14, { description: 'Dental Checkup', amount: 95.00, type: 'expense', category: 'Healthcare' });
    }

    // Freelance income — positions 1, 3, 5
    if ([1, 3, 5].includes(idx)) {
      push(28, { description: 'Freelance Web Dev Project — Client A', amount: 1200.00, type: 'income', category: 'Freelance Income', notes: `Invoice #${idx + 101}` });
    }
    if (idx === 2) {
      push(15, { description: 'Freelance Consulting — UX Review', amount: 450.00, type: 'income', category: 'Freelance Income' });
    }
  }

  return txns;
}

function generateUser2Transactions(): SeedTransaction[] {
  const months = getLastMonths(3);
  const txns: SeedTransaction[] = [];

  for (let idx = 0; idx < months.length; idx++) {
    const { year, month } = months[idx];

    function push(day: number, data: Omit<SeedTransaction, 'date'>): void {
      const date = safeDate(year, month, day);
      if (date) txns.push({ ...data, date });
    }

    push(1, { description: 'Monthly Salary', amount: 4200.00, type: 'income', category: 'Salary' });
    push(1, { description: 'Rent Payment', amount: 1300.00, type: 'expense', category: 'Rent / Mortgage' });
    push(3, { description: 'Bus Pass', amount: 80.00, type: 'expense', category: 'Transport' });
    push(5, { description: 'Grocery Shopping', amount: 65.40, type: 'expense', category: 'Food & Dining' });

    if ([1, 2].includes(idx)) {
      push(20, { description: 'Freelance Income', amount: 800.00, type: 'income', category: 'Freelance Income' });
    }
  }

  return txns;
}

export async function seedDatabase(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count, 10) > 0) {
      console.log('Database already seeded, skipping.');
      return;
    }

    console.log('Seeding database...');

    const password1Hash = await bcrypt.hash('password123', 10);
    const password2Hash = await bcrypt.hash('testpass1', 10);

    const { rows: user1Rows } = await client.query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id`,
      ['demo@fintrack.io', password1Hash, 'Alex Morgan']
    );
    const { rows: user2Rows } = await client.query(
      `INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id`,
      ['test@fintrack.io', password2Hash, 'Jamie Lee']
    );

    const user1Id = user1Rows[0].id;
    const user2Id = user2Rows[0].id;

    const user1Txns = generateTransactions();
    for (const txn of user1Txns) {
      await client.query(
        `INSERT INTO transactions (user_id, description, amount, type, category, date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user1Id, txn.description, txn.amount, txn.type, txn.category, txn.date, txn.notes || null]
      );
    }

    const user2Txns = generateUser2Transactions();
    for (const txn of user2Txns) {
      await client.query(
        `INSERT INTO transactions (user_id, description, amount, type, category, date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user2Id, txn.description, txn.amount, txn.type, txn.category, txn.date, txn.notes || null]
      );
    }

    console.log(`Seeded ${user1Txns.length} transactions for demo user, ${user2Txns.length} for test user.`);
  } finally {
    client.release();
  }
}
