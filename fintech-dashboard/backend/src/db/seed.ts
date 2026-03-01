import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Salary',
  'Rent / Mortgage',
  'Entertainment',
  'Healthcare',
  'Freelance Income',
  'Utilities',
];

interface SeedTransaction {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes?: string;
}

function dateStr(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function generateTransactions(): SeedTransaction[] {
  const txns: SeedTransaction[] = [];

  // 6 months: Sep 2025 – Feb 2026
  const months = [
    { year: 2025, month: 9 },
    { year: 2025, month: 10 },
    { year: 2025, month: 11 },
    { year: 2025, month: 12 },
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
  ];

  for (const { year, month } of months) {
    // Salary — 1st of month
    txns.push({
      description: 'Monthly Salary — Software Engineer',
      amount: 5200.00,
      type: 'income',
      category: 'Salary',
      date: dateStr(year, month, 1),
      notes: 'Net pay after tax and PRSI',
    });

    // Rent — 1st
    txns.push({
      description: 'Monthly Rent Payment',
      amount: 1450.00,
      type: 'expense',
      category: 'Rent / Mortgage',
      date: dateStr(year, month, 1),
    });

    // Utilities — 5th
    txns.push({
      description: 'Electricity & Gas Bill',
      amount: 120.50,
      type: 'expense',
      category: 'Utilities',
      date: dateStr(year, month, 5),
    });

    // Internet — 10th
    txns.push({
      description: 'Broadband Internet Subscription',
      amount: 49.99,
      type: 'expense',
      category: 'Utilities',
      date: dateStr(year, month, 10),
    });

    // Food & Dining — weekly grocery shopping
    const groceryDates = [3, 10, 17, 24];
    const groceryAmounts = [87.40, 92.15, 78.65, 105.30];
    for (let i = 0; i < groceryDates.length; i++) {
      txns.push({
        description: 'Weekly Grocery Shopping — Tesco',
        amount: groceryAmounts[i],
        type: 'expense',
        category: 'Food & Dining',
        date: dateStr(year, month, groceryDates[i]),
      });
    }

    // Lunch and coffee during weekdays
    txns.push({
      description: 'Lunch — Café on the Green',
      amount: 14.50,
      type: 'expense',
      category: 'Food & Dining',
      date: dateStr(year, month, 7),
    });
    txns.push({
      description: 'Coffee subscription — Morning delivery',
      amount: 22.00,
      type: 'expense',
      category: 'Food & Dining',
      date: dateStr(year, month, 14),
    });
    txns.push({
      description: 'Dinner out — Klaw Seafood',
      amount: 68.00,
      type: 'expense',
      category: 'Food & Dining',
      date: dateStr(year, month, 20),
      notes: 'Anniversary dinner',
    });

    // Transport
    txns.push({
      description: 'Monthly Leap Card Top-Up',
      amount: 100.00,
      type: 'expense',
      category: 'Transport',
      date: dateStr(year, month, 2),
    });
    txns.push({
      description: 'Taxi — Late night',
      amount: 18.50,
      type: 'expense',
      category: 'Transport',
      date: dateStr(year, month, 15),
    });

    // Entertainment
    txns.push({
      description: 'Netflix Subscription',
      amount: 15.99,
      type: 'expense',
      category: 'Entertainment',
      date: dateStr(year, month, 8),
    });
    txns.push({
      description: 'Spotify Premium',
      amount: 10.99,
      type: 'expense',
      category: 'Entertainment',
      date: dateStr(year, month, 8),
    });
    txns.push({
      description: 'Cinema — Cineworld',
      amount: 24.00,
      type: 'expense',
      category: 'Entertainment',
      date: dateStr(year, month, 22),
    });

    // Healthcare (not every month)
    if ([9, 11, 1].includes(month)) {
      txns.push({
        description: 'GP Visit',
        amount: 60.00,
        type: 'expense',
        category: 'Healthcare',
        date: dateStr(year, month, 12),
      });
    }
    if (month === 10) {
      txns.push({
        description: 'Pharmacy — Prescription',
        amount: 32.50,
        type: 'expense',
        category: 'Healthcare',
        date: dateStr(year, month, 18),
        notes: 'Monthly prescription refill',
      });
    }
    if (month === 2) {
      txns.push({
        description: 'Dental Checkup',
        amount: 95.00,
        type: 'expense',
        category: 'Healthcare',
        date: dateStr(year, month, 14),
      });
    }

    // Freelance income (some months)
    if ([10, 12, 2].includes(month)) {
      txns.push({
        description: 'Freelance Web Dev Project — Client A',
        amount: 1200.00,
        type: 'income',
        category: 'Freelance Income',
        date: dateStr(year, month, 28),
        notes: 'Invoice #' + (month + 100),
      });
    }
    if (month === 11) {
      txns.push({
        description: 'Freelance Consulting — UX Review',
        amount: 450.00,
        type: 'income',
        category: 'Freelance Income',
        date: dateStr(year, month, 15),
      });
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

    const transactions = generateTransactions();

    for (const txn of transactions) {
      await client.query(
        `INSERT INTO transactions (user_id, description, amount, type, category, date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user1Id, txn.description, txn.amount, txn.type, txn.category, txn.date, txn.notes || null]
      );
    }

    // Seed a smaller set for user2
    const user2Txns: SeedTransaction[] = [
      { description: 'Monthly Salary', amount: 4200.00, type: 'income', category: 'Salary', date: '2026-02-01' },
      { description: 'Rent Payment', amount: 1300.00, type: 'expense', category: 'Rent / Mortgage', date: '2026-02-01' },
      { description: 'Grocery Shopping', amount: 65.40, type: 'expense', category: 'Food & Dining', date: '2026-02-05' },
      { description: 'Bus Pass', amount: 80.00, type: 'expense', category: 'Transport', date: '2026-02-03' },
      { description: 'Freelance Income', amount: 800.00, type: 'income', category: 'Freelance Income', date: '2026-02-20' },
      { description: 'Monthly Salary', amount: 4200.00, type: 'income', category: 'Salary', date: '2026-01-01' },
      { description: 'Rent Payment', amount: 1300.00, type: 'expense', category: 'Rent / Mortgage', date: '2026-01-01' },
      { description: 'Grocery Shopping', amount: 71.20, type: 'expense', category: 'Food & Dining', date: '2026-01-08' },
    ];

    for (const txn of user2Txns) {
      await client.query(
        `INSERT INTO transactions (user_id, description, amount, type, category, date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user2Id, txn.description, txn.amount, txn.type, txn.category, txn.date, txn.notes || null]
      );
    }

    console.log(`Seeded ${transactions.length + user2Txns.length} transactions for 2 users.`);
  } finally {
    client.release();
  }
}
