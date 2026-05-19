# EIC Enterprise

EIC (Enterprise. Integrated. Connected.) — a unified SaaS platform for African enterprises integrating accounting, EFRIS/URA tax compliance, Stripe payments (MTN MoMo, M-Pesa), CRM, HR & Payroll, Inventory, Project Management, AI (ARIA), invoicing, crypto/Pi Network, IT management, and banking — sharing one ledger and database.

## Architecture

- **Backend**: Express.js + SQLite (`server.js`) running on port 5001
- **Frontend**: React + Vite + Tailwind CSS (`frontend/`) — dev server at port 5000, proxying /api to port 5001
- **Database**: SQLite file at `./eic-enterprise.db`
- **Charts**: Recharts (Area, Bar, Pie)
- **Icons**: Lucide React + inline SVGs
- **Auth**: bcrypt password hashing + JWT tokens (8h expiry)

## Workflow

Runs both services in one workflow:
```
PORT=5001 node server.js & npm run dev --prefix frontend
```
- Vite: http://localhost:5000 (webview)
- API: http://localhost:5001

## Platform Modules (12 total)

| Module | File | Description |
|--------|------|-------------|
| Smart Dashboard | `frontend/src/modules/SmartDashboard.jsx` | KPI cards, revenue/expenses/tax area chart, tax pie, cash flow bar chart, live transaction ledger |
| ERP Accounting | `frontend/src/modules/Accounting.jsx` | General ledger, P&L statement, AR aging, Chart of Accounts, journal entry form |
| EFRIS / Tax | `frontend/src/modules/EFRIS.jsx` | URA EFRIS filing, VAT auto-compute, e-invoices with QR, TIN lookup, multi-country tax (KRA, TRA, RRA, FIRS, HMRC) |
| Pi Wallet | `frontend/src/modules/Wallet.jsx` | MTN MoMo, Airtel Money, M-Pesa, bank transfer, payment request links, bulk disbursement |
| Banking | `frontend/src/modules/Banking.jsx` | Centenary/Stanbic/DFCU bank accounts, fund transfers, statement download, reconciliation |
| CRM | `frontend/src/modules/CRM.jsx` | Contacts with AI lead scores, Kanban pipeline, country revenue analytics |
| HR & Payroll | `frontend/src/modules/HR.jsx` | Employee directory, leave management, payroll run with PAYE/NSSF, payroll history chart |
| Inventory | `frontend/src/modules/Inventory.jsx` | Product catalogue, purchase orders, stock movements, analytics by category |
| Projects | `frontend/src/modules/Projects.jsx` | Kanban board, list view, task priority/progress, milestone tracker |
| IT Management | `frontend/src/modules/ITManagement.jsx` | Asset register, security health scoring, license tracking, network monitoring |
| Crypto & Pi | `frontend/src/modules/Crypto.jsx` | Live crypto rates, Pi Coin 20% discount, crypto payment links, portfolio tracking |
| ARIA — AI | `frontend/src/modules/ARIA.jsx` | AI chat assistant with financial context, smart suggestions, local intelligence fallback |
| Marketplace | `frontend/src/modules/Store.jsx` | Add-on store with 12 products, cart, search, category filters, ratings/reviews |

## Key Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port override (default: 5001 in production) |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `SQLITE_FILE` | Path to the SQLite database file |
| `DISABLE_EMAIL` | Set to `true` to skip email sending |
| `STRIPE_SECRET_KEY` | Stripe secret key (set as Replit Secret) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (set as Replit Secret) |

## API Routes

### Auth
- `POST /api/auth/register` — Register: requires `{name, email, password}`, returns JWT. bcrypt hashed.
- `POST /api/auth/login` — Login: requires `{email, password}`, returns JWT. bcrypt validated.

### Companies & Admin
- `GET/POST /api/companies` — List / create companies (auth required)
- `GET/PUT/DELETE /api/companies/:id` — Manage a company (auth required)
- `POST /api/demo-request` — Submit a demo request (public)
- `GET /api/admin/demo-requests` — List demo requests (auth required)

### Payments
- `GET /api/stripe/config` — Return Stripe publishable key (public)
- `POST /api/stripe/create-payment-intent` — Create a Stripe payment intent (auth required)
- `GET /api/stripe/payment-intents` — List recent payment intents (auth required)

### Financial Data
- `GET/POST /api/invoices` — Manage invoices (auto VAT 18%, EFRIS number generation)
- `GET/POST /api/contacts` — CRM contacts with lead scoring
- `GET/POST /api/assets` — IT asset register
- `GET/POST /api/transactions` — Financial transactions
- `GET/POST /api/journal-entries` — Accounting journal entries

### AI
- `POST /api/aria/chat` — ARIA AI chat (falls back to local intelligence)

## Database Tables

- `users` — Authentication accounts (bcrypt password_hash)
- `companies` — Company records
- `demo_requests` — Demo request submissions
- `transactions` — Financial transactions
- `invoices` — EFRIS-compliant invoices with VAT
- `contacts` — CRM contacts with lead scoring & pipeline stages
- `assets` — IT asset register
- `journal_entries` — Double-entry accounting journal

## Landing Page

- **Hero** — Video background (platform-preview.mp4), headline, CTA buttons, stats
- **Pricing** — 4-tier: Starter $29, Growth $99, Business $299, Enterprise Custom
- **Modules** — Grid showcasing all 12 modules
- **Testimonials** — 6 customer review cards
- **Trust Partners** — Integration logos (Stripe, MTN MoMo, M-Pesa, EFRIS, etc.)

## Design System

- **Colors**: Strict black/white/gray palette (`#0a0a0a` bg, `#141414` cards, `#F7F7F7` off-white)
- **Fonts**: Sora (headings), Inter Tight (body)
- **Cards**: `#141414` with `border-white/6`, `rounded-2xl`, hover transition
- **Sidebar**: Collapsible (240px ↔ 60px) with smooth width transition
- **Buttons**: White on black (primary), ghost borders (secondary)
- **Animations**: fadeUp, scaleIn, float, shimmer, glow-pulse CSS keyframes

## SEO & PWA

- `frontend/index.html` — Title, meta description, OG/Twitter tags, PWA manifest link
- `frontend/public/manifest.json` — PWA manifest with app name, colors, icons
- `frontend/public/favicon.svg` — SVG favicon (logo mark)
