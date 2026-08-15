-- ============================================
-- 💍 CASAMENTO FINANCEIRO - SCHEMA PostgreSQL
-- ============================================

-- Extensão para UUID (opcional, mas recomendado)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: transactions
-- Armazena gastos (expenses) e depósitos (deposits)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'deposit')),
    description VARCHAR(255) NOT NULL,
    value DECIMAL(12, 2) NOT NULL CHECK (value > 0),
    category VARCHAR(100) DEFAULT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- ============================================
-- TABELA: settings
-- Configurações gerais (orçamento, data do casamento)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Garante apenas 1 registro
    budget DECIMAL(12, 2) DEFAULT 0,
    wedding_date DATE DEFAULT '2026-10-17',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO settings (id, budget, wedding_date) 
VALUES (1, 0, '2026-10-17')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS ÚTEIS (opcional)
-- ============================================

-- View: Resumo financeiro
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    COALESCE(SUM(CASE WHEN type = 'deposit' THEN value ELSE 0 END), 0) AS total_deposits,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END), 0) AS total_expenses,
    COALESCE(SUM(CASE WHEN type = 'deposit' THEN value ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN type = 'expense' THEN value ELSE 0 END), 0) AS balance,
    COUNT(CASE WHEN type = 'deposit' THEN 1 END) AS deposit_count,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) AS expense_count
FROM transactions;

-- View: Gastos por categoria
CREATE OR REPLACE VIEW expenses_by_category AS
SELECT 
    COALESCE(category, 'Sem categoria') AS category,
    SUM(value) AS total,
    COUNT(*) AS count
FROM transactions 
WHERE type = 'expense'
GROUP BY category
ORDER BY total DESC;

-- ============================================
-- DADOS DE EXEMPLO (opcional - comente se não quiser)
-- ============================================

-- INSERT INTO transactions (type, description, value, category, date) VALUES
-- ('deposit', 'Salário Janeiro', 5000.00, NULL, '2025-01-05'),
-- ('deposit', 'Presente dos pais', 10000.00, NULL, '2025-01-10'),
-- ('expense', 'Reserva do buffet', 8000.00, 'Recepção', '2025-01-15'),
-- ('expense', 'Fotógrafo - Sinal', 2000.00, 'Fotografia', '2025-01-20'),
-- ('expense', 'Convites - Gráfica', 500.00, 'Convites', '2025-01-25');

-- UPDATE settings SET budget = 50000.00 WHERE id = 1;
