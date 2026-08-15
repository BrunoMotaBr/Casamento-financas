# 💍 Casamento Financeiro — Controle com PostgreSQL

Aplicação web para controle financeiro de casamento com backend Node.js e PostgreSQL.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)

## ✨ Funcionalidades

- 📊 **Dashboard em tempo real** — Total em caixa, gastos, saldo e dias restantes
- 💸 **Cadastro de gastos** — Com descrição, valor, categoria e data
- 🏦 **Cadastro de depósitos** — Registre economias
- 📂 **Gastos por categoria** — Breakdown visual
- 📋 **Histórico completo** — Com busca e filtros
- ✏️ **Editar e excluir** — CRUD completo
- ⏳ **Contagem regressiva** — Dias até o casamento
- 📤 **Exportar/Importar** — Backup em JSON
- 💾 **PostgreSQL** — Dados persistentes no banco

---

## 📁 Estrutura do Projeto

```
casamento-financeiro/
├── public/
│   └── index.html      # Frontend (HTML + CSS + JS)
├── db/
│   └── schema.sql      # Script SQL para criar tabelas
├── server.js           # Servidor Node.js + Express + PostgreSQL
├── package.json        # Dependências
├── .env.example        # Exemplo de variáveis de ambiente
└── README.md           # Este arquivo
```

---

## 🚀 Instalação

### 1. Clone o projeto

```bash
git clone <seu-repositorio>
cd casamento-financeiro
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

Copie o arquivo de exemplo e edite com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/casamento_db
PORT=3000
NODE_ENV=development
```

### 4. Crie o banco e as tabelas

```bash
# Primeiro, crie o banco de dados (se não existir)
createdb casamento_db

# Depois, execute o schema
psql -d casamento_db -f db/schema.sql
```

Ou via psql interativo:

```bash
psql -U seu_usuario
```

```sql
CREATE DATABASE casamento_db;
\c casamento_db
\i db/schema.sql
```

### 5. Inicie o servidor

```bash
# Produção
npm start

# Desenvolvimento (com auto-reload no Node 18+)
npm run dev
```

### 6. Acesse a aplicação

Abra no navegador: **http://localhost:3000**

---

## 🗃️ Comandos SQL para Criar as Tabelas

Execute estes comandos no PostgreSQL (ou use o arquivo `db/schema.sql`):

```sql
-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de transações (gastos e depósitos)
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    budget DECIMAL(12, 2) DEFAULT 0,
    wedding_date DATE DEFAULT '2026-10-17',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO settings (id, budget, wedding_date) 
VALUES (1, 0, '2026-10-17')
ON CONFLICT (id) DO NOTHING;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
```

---

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/transactions` | Lista transações (query: `type`, `search`, `limit`, `offset`) |
| GET | `/api/transactions/:id` | Busca uma transação |
| POST | `/api/transactions` | Cria transação |
| PUT | `/api/transactions/:id` | Atualiza transação |
| DELETE | `/api/transactions/:id` | Exclui transação |
| GET | `/api/summary` | Resumo financeiro completo |
| GET | `/api/settings` | Configurações |
| PUT | `/api/settings` | Atualiza configurações |
| GET | `/api/export` | Exporta todos os dados |
| POST | `/api/import` | Importa dados |
| DELETE | `/api/clear` | Limpa todos os dados |

---

## 🌐 Deploy em Produção

### Opção 1: Railway

1. Crie conta em [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Adicione PostgreSQL (Add Plugin)
4. Configure a variável `DATABASE_URL` (Railway faz automaticamente)
5. Deploy!

### Opção 2: Render

1. Crie conta em [render.com](https://render.com)
2. New Web Service → Connect GitHub
3. Crie um PostgreSQL separado
4. Configure `DATABASE_URL` nas Environment Variables
5. Deploy!

### Opção 3: Heroku

```bash
heroku create casamento-financeiro
heroku addons:create heroku-postgresql:mini
git push heroku main
heroku run psql -f db/schema.sql
```

### Opção 4: VPS (DigitalOcean, AWS, etc.)

```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Criar usuário e banco
sudo -u postgres createuser --interactive
sudo -u postgres createdb casamento_db

# Configurar .env e rodar
npm install
npm start
```

---

## 🔒 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `DB_HOST` | Host do banco (alternativa) | `localhost` |
| `DB_PORT` | Porta do banco (alternativa) | `5432` |
| `DB_NAME` | Nome do banco (alternativa) | `casamento_db` |
| `DB_USER` | Usuário (alternativa) | `postgres` |
| `DB_PASSWORD` | Senha (alternativa) | `minhasenha` |
| `PORT` | Porta do servidor Node | `3000` |
| `NODE_ENV` | Ambiente | `development` ou `production` |

---

## 🧪 Testando a API

```bash
# Criar um gasto
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"type":"expense","description":"Teste Buffet","value":5000,"category":"Recepção"}'

# Criar um depósito
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"type":"deposit","description":"Salário","value":3000}'

# Ver resumo
curl http://localhost:3000/api/summary

# Listar transações
curl http://localhost:3000/api/transactions
```

---

## 📄 Licença

MIT — Use e modifique livremente! 💕

---

Feito com 💍 para o grande dia!
