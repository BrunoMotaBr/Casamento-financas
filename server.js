// ============================================
// 💍 CASAMENTO FINANCEIRO - VERSÃO VERCEL
// ============================================

const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuração do Pool (Igual ao primeiro arquivo, usando DATABASE_URL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    // Configurações extras para estabilidade em Serverless
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Middlewares
app.use(cors());
app.use(express.json());

// ============================================
// ROTAS - TRANSACTIONS
// ============================================

// GET /api/transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const { type, search, limit = 100, offset = 0 } = req.query;
        let query = 'SELECT * FROM transactions WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (type && (type === 'expense' || type === 'deposit')) {
            query += ` AND type = $${paramIndex++}`;
            params.push(type);
        }
        if (search) {
            query += ` AND (description ILIKE $${paramIndex++} OR category ILIKE $${paramIndex++})`;
            params.push(`%${search}%`, `%${search}%`);
        }
        query += ' ORDER BY date DESC, created_at DESC';
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro:', err);
        res.status(500).json({ error: 'Erro ao buscar transações' });
    }
});

// POST /api/transactions
app.post('/api/transactions', async (req, res) => {
    try {
        const { type, description, value, category, date } = req.body;
        const result = await pool.query(
            `INSERT INTO transactions (type, description, value, category, date) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [type, description.trim(), value, category || null, date || new Date().toISOString().split('T')[0]]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar transação' });
    }
});

// DELETE /api/transactions/:id
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Não encontrado' });
        res.json({ message: 'Excluído', data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir' });
    }
});

// ============================================
// ROTAS - SUMMARY (Resumo financeiro)
// ============================================

app.get('/api/summary', async (req, res) => {
    try {
        // Busca em paralelo para ser mais rápido
        const [summaryResult, categoryResult, settingsResult] = await Promise.all([
            pool.query('SELECT * FROM financial_summary'),
            pool.query('SELECT * FROM expenses_by_category'),
            pool.query('SELECT * FROM settings WHERE id = 1')
        ]);

        const summary = summaryResult.rows[0] || { total_deposits: 0, total_expenses: 0, balance: 0 };
        const settings = settingsResult.rows[0] || { budget: 0, wedding_date: '2026-10-17' };

        const weddingDate = new Date(settings.wedding_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((weddingDate - today) / (1000 * 60 * 60 * 24));

        res.json({
            totalDeposits: parseFloat(summary.total_deposits) || 0,
            totalExpenses: parseFloat(summary.total_expenses) || 0,
            balance: parseFloat(summary.balance) || 0,
            depositCount: parseInt(summary.deposit_count) || 0,
            expenseCount: parseInt(summary.expense_count) || 0,
            budget: parseFloat(settings.budget) || 0,
            weddingDate: settings.wedding_date,
            daysLeft: daysLeft,
            categories: categoryResult.rows.map(c => ({
                category: c.category,
                total: parseFloat(c.total),
                count: parseInt(c.count)
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar resumo' });
    }
});

// ============================================
// ROTAS - SETTINGS
// ============================================

app.get('/api/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings WHERE id = 1');
        if (result.rows.length === 0) {
            return res.json({ budget: 0, weddingDate: '2026-10-17' });
        }
        res.json({
            budget: parseFloat(result.rows[0].budget) || 0,
            weddingDate: result.rows[0].wedding_date
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro nas configurações' });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const { budget, weddingDate } = req.body;
        const result = await pool.query(
            `INSERT INTO settings (id, budget, wedding_date) VALUES (1, $1, $2)
             ON CONFLICT (id) DO UPDATE SET budget = $1, wedding_date = $2 RETURNING *`,
            [budget || 0, weddingDate || '2026-10-17']
        );
        res.json({
            budget: parseFloat(result.rows[0].budget) || 0,
            weddingDate: result.rows[0].wedding_date
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar' });
    }
});

// ============================================
// EXPORTAÇÃO PARA VERCEL (Igual ao primeiro arquivo)
// ============================================

// Importante: Não usamos app.listen() no Vercel.
// Exportamos o app como o handler da função.
module.exports = app;