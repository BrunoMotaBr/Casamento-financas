const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send();

  try {
    const [summaryRes, categoryRes, settingsRes] = await Promise.all([
      pool.query('SELECT * FROM financial_summary'),
      pool.query('SELECT * FROM expenses_by_category'),
      pool.query('SELECT * FROM settings WHERE id = 1')
    ]);

    const summary = summaryRes.rows[0] || { total_deposits: 0, total_expenses: 0, balance: 0 };
    const settings = settingsRes.rows[0] || { budget: 0, wedding_date: '2026-10-17' };

    // Cálculo simples de dias
    const daysLeft = Math.ceil((new Date(settings.wedding_date) - new Date()) / (1000 * 60 * 60 * 24));

    return res.status(200).json({
      totalDeposits: parseFloat(summary.total_deposits) || 0,
      totalExpenses: parseFloat(summary.total_expenses) || 0,
      balance: parseFloat(summary.balance) || 0,
      budget: parseFloat(settings.budget) || 0,
      weddingDate: settings.wedding_date,
      daysLeft,
      categories: categoryRes.rows
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};