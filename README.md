# 💍 Nosso Casamento — Controle Financeiro

Aplicação web para controle financeiro de casamento. Gerencie gastos, economias e acompanhe tudo até o grande dia!

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## ✨ Funcionalidades

- 📊 **Dashboard em tempo real** — Visualize total em caixa, gastos, saldo e dias restantes
- 💸 **Cadastro de gastos** — Registre despesas com descrição, valor, categoria e data
- 🏦 **Cadastro de caixa** — Registre depósitos/economias
- 📂 **Gastos por categoria** — Breakdown visual por categoria de gasto
- 📋 **Histórico completo** — Lista de todas as movimentações com busca e filtros
- ✏️ **Editar e excluir** — Gerencie suas entradas facilmente
- ⏳ **Contagem regressiva** — Dias restantes até o casamento
- 💒 **Barra de orçamento** — Acompanhe quanto do orçamento já foi utilizado
- 📤 **Exportar/Importar** — Backup dos dados em JSON
- 📲 **PWA** — Instale como app no celular, funciona offline
- 💾 **localStorage** — Dados persistem entre sessões, sem servidor

## 🚀 Deploy no GitHub Pages

### Opção 1: Via interface do GitHub

1. Crie um repositório no GitHub (ex: `casamento-financas`)
2. Faça upload de todos os arquivos:
   - `index.html`
   - `sw.js`
   - `manifest.json`
   - `README.md`
3. Vá em **Settings** → **Pages**
4. Em **Source**, selecione **Deploy from a branch**
5. Escolha a branch `main` e pasta `/ (root)`
6. Clique em **Save**
7. Aguarde alguns minutos e acesse: `https://seuusuario.github.io/casamento-financas/`

### Opção 2: Via terminal (Git)

```bash
# Clone ou inicialize o repositório
git init
git add .
git commit -m "🎉 Controle financeiro do casamento"

# Adicione o remote (substitua pela URL do seu repo)
git remote add origin https://github.com/seuusuario/casamento-financas.git

# Push
git branch -M main
git push -u origin main
```

Depois, ative o GitHub Pages nas configurações do repositório.

## 📁 Estrutura do Projeto

```
/
├── index.html      # Aplicação principal (HTML + CSS + JS inline)
├── sw.js           # Service Worker para PWA/offline
├── manifest.json   # Manifesto PWA
└── README.md       # Este arquivo
```

## 🛠️ Tecnologias

- **HTML5** — Estrutura semântica
- **CSS3** — Estilos responsivos com variáveis CSS, gradientes e animações
- **JavaScript Vanilla** — Lógica de negócio, sem frameworks
- **localStorage** — Persistência de dados no navegador
- **Service Worker** — Funcionamento offline (PWA)
- **Google Fonts** — Playfair Display + Inter

## ⚙️ Configurações

Clique no botão ⚙️ (canto inferior direito) para:

- **Definir orçamento total** — A barra de progresso mostrará quanto já foi gasto
- **Alterar a data do casamento** — A contagem regressiva será atualizada
- **Exportar dados** — Salve um backup em JSON
- **Importar dados** — Restaure de um backup
- **Limpar dados** — Apague tudo (com confirmação dupla)

## 📱 Instalação como App (PWA)

No celular (Chrome/Safari):
1. Acesse o site pelo navegador
2. Toque em "Adicionar à tela inicial" (ou aceite o banner de instalação)
3. O app ficará disponível como um ícone na tela do celular

## 🎨 Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Blush | `#b5838d` | Cor principal |
| Rose | `#f43f5e` | Destaques/alertas |
| Sage | `#87a878` | Depósitos/positivo |
| Gold | `#c9a84c` | Saldo |
| Champagne | `#f5e6cc` | Categorias |
| Cream | `#fefaf6` | Fundo |

## 📄 Licença

Este projeto é de uso livre. Faça suas modificações e personalize para o seu casamento! 💕

---

Feito com 💕 para o grande dia!
