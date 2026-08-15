// ============================================
// 💍 CASAMENTO FINANCEIRO - SERVIDOR NODE.JS
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CONFIGURAÇÃO DO POSTGRESQL
// ============================================

// TODO: Configure suas credenciais no arquivo .env
const pool = new Pool({
  // Opção 1: Usar DATABASE_URL (comum em produção/Heroku/Railway/Render)
  connectionString: process.env.DATABASE_URL,
  
  // Opção 2: Usar variáveis separadas (descomente se preferir)
  // host: process.env.DB_HOST || 'localhost',
  // port: process.env.DB_PORT || 5432,
  // database: process.env.DB_NAME || 'casamento_db',
  // user: process.env.DB_USER || 'postgres',
  // password: process.env.DB_PASSWORD || '',
  
  // Configurações de SSL (necessário para alguns provedores cloud)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Pool settings
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testar conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', err.message);
    console.error('   Verifique as configurações no arquivo .env');
  } else {
    console.log('✅ Conectado ao PostgreSQL:', res.rows[0].now);
  }
});

// ============================================
// MIDDLEWARES
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// ROTAS - TRANSACTIONS
// ============================================

// GET /api/transactions - Listar todas as transações
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
    console.error('Erro ao buscar transações:', err);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// GET /api/transactions/:id - Buscar uma transação
app.get('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar transação:', err);
    res.status(500).json({ error: 'Erro ao buscar transação' });
  }
});

// POST /api/transactions - Criar transação
app.post('/api/transactions', async (req, res) => {
  try {
    const { type, description, value, category, date } = req.body;
    
    // Validações
    if (!type || !['expense', 'deposit'].includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido (expense ou deposit)' });
    }
    if (!description || description.trim() === '') {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }
    if (!value || value <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }
    
    const result = await pool.query(
      `INSERT INTO transactions (type, description, value, category, date) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [type, description.trim(), value, category || null, date || new Date().toISOString().split('T')[0]]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar transação:', err);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// PUT /api/transactions/:id - Atualizar transação
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, value, category, date } = req.body;
    
    // Validações
    if (description !== undefined && description.trim() === '') {
      return res.status(400).json({ error: 'Descrição não pode ser vazia' });
    }
    if (value !== undefined && value <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }
    
    const result = await pool.query(
      `UPDATE transactions 
       SET description = COALESCE($1, description),
           value = COALESCE($2, value),
           category = COALESCE($3, category),
           date = COALESCE($4, date)
       WHERE id = $5
       RETURNING *`,
      [description?.trim(), value, category, date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar transação:', err);
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// DELETE /api/transactions/:id - Excluir transação
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    res.json({ message: 'Transação excluída', data: result.rows[0] });
  } catch (err) {
    console.error('Erro ao excluir transação:', err);
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

// ============================================
// ROTAS - SUMMARY (Resumo financeiro)
// ============================================

// GET /api/summary - Resumo completo
app.get('/api/summary', async (req, res) => {
  try {
    const summaryResult = await pool.query('SELECT * FROM financial_summary');
    const categoryResult = await pool.query('SELECT * FROM expenses_by_category');
    const settingsResult = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    const summary = summaryResult.rows[0];
    const settings = settingsResult.rows[0] || { budget: 0, wedding_date: '2026-10-17' };
    
    // Calcular dias restantes
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
    console.error('Erro ao buscar resumo:', err);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
});

// ============================================
// ROTAS - SETTINGS
// ============================================

// GET /api/settings - Obter configurações
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    if (result.rows.length === 0) {
      // Criar configuração padrão se não existir
      await pool.query(
        'INSERT INTO settings (id, budget, wedding_date) VALUES (1, 0, $1)',
        ['2026-10-17']
      );
      return res.json({ budget: 0, wedding_date: '2026-10-17' });
    }
    
    res.json({
      budget: parseFloat(result.rows[0].budget) || 0,
      weddingDate: result.rows[0].wedding_date
    });
  } catch (err) {
    console.error('Erro ao buscar configurações:', err);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// PUT /api/settings - Atualizar configurações
app.put('/api/settings', async (req, res) => {
  try {
    const { budget, weddingDate } = req.body;
    
    const result = await pool.query(
      `INSERT INTO settings (id, budget, wedding_date) 
       VALUES (1, $1, $2)
       ON CONFLICT (id) 
       DO UPDATE SET budget = $1, wedding_date = $2
       RETURNING *`,
      [budget || 0, weddingDate || '2026-10-17']
    );
    
    res.json({
      budget: parseFloat(result.rows[0].budget) || 0,
      weddingDate: result.rows[0].wedding_date
    });
  } catch (err) {
    console.error('Erro ao atualizar configurações:', err);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// ============================================
// ROTAS - IMPORT/EXPORT
// ============================================

// GET /api/export - Exportar todos os dados
app.get('/api/export', async (req, res) => {
  try {
    const transactions = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
    const settings = await pool.query('SELECT * FROM settings WHERE id = 1');
    
    res.json({
      transactions: transactions.rows,
      settings: settings.rows[0] || { budget: 0, wedding_date: '2026-10-17' },
      exportDate: new Date().toISOString()
    });
  } catch (err) {
    console.error('Erro ao exportar dados:', err);
    res.status(500).json({ error: 'Erro ao exportar dados' });
  }
});

// POST /api/import - Importar dados
app.post('/api/import', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { transactions, settings, clearExisting = false } = req.body;
    
    await client.query('BEGIN');
    
    // Limpar dados existentes se solicitado
    if (clearExisting) {
      await client.query('DELETE FROM transactions');
    }
    
    // Importar transações
    if (transactions && Array.isArray(transactions)) {
      for (const tx of transactions) {
        await client.query(
          `INSERT INTO transactions (type, description, value, category, date, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [tx.type, tx.description, tx.value, tx.category, tx.date, tx.created_at || new Date()]
        );
      }
    }
    
    // Importar configurações
    if (settings) {
      await client.query(
        `INSERT INTO settings (id, budget, wedding_date) 
         VALUES (1, $1, $2)
         ON CONFLICT (id) DO UPDATE SET budget = $1, wedding_date = $2`,
        [settings.budget || 0, settings.wedding_date || settings.weddingDate || '2026-10-17']
      );
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Dados importados com sucesso',
      imported: transactions ? transactions.length : 0
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao importar dados:', err);
    res.status(500).json({ error: 'Erro ao importar dados' });
  } finally {
    client.release();
  }
});

// DELETE /api/clear - Limpar todos os dados
app.delete('/api/clear', async (req, res) => {
  try {
    await pool.query('DELETE FROM transactions');
    await pool.query('UPDATE settings SET budget = 0, wedding_date = $1 WHERE id = 1', ['2026-10-17']);
    
    res.json({ message: 'Todos os dados foram limpos' });
  } catch (err) {
    console.error('Erro ao limpar dados:', err);
    res.status(500).json({ error: 'Erro ao limpar dados' });
  }
});

// ============================================
// SERVIR FRONTEND
// ============================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  💍 Casamento Financeiro - Servidor Rodando   ║
╠════════════════════════════════════════════════╣
║  URL: http://localhost:${PORT}                    ║
║  API: http://localhost:${PORT}/api                ║
╚════════════════════════════════════════════════╝
  `);
});

module.exports = app;