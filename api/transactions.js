const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  try {
    // LISTAR TRANSAÇÕES (GET)
    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 100');
      return res.status(200).json(rows);
    }

    // CRIAR TRANSAÇÃO (POST)
    if (req.method === 'POST') {
      const { type, description, value, category, date } = req.body;
      const query = `
        INSERT INTO transactions (type, description, value, category, date) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`;
      const { rows } = await pool.query(query, [type, description, value, category, date || new Date()]);
      return res.status(201).json(rows[0]);
    }

    // DELETAR TRANSAÇÃO (DELETE)
    if (req.method === 'DELETE') {
      const { id } = req.query; // Pega o ID da URL (?id=...)
      await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Excluído' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};