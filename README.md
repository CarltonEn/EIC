# EIC-Enterprise

## Overview

EIC Enterprise is a full-stack ERP sales-demo and launch candidate with:

- 12 ERP modules: dashboard, accounting, EFRIS/tax, wallet, banking, CRM, HR/payroll, inventory, projects, IT, crypto/Pi, and ARIA AI
- User registration/login with JWT + refresh tokens
- SQLite-backed CRUD for launch-critical entities
- Demo lead capture, admin review, notification hooks, Stripe live-payment readiness, and adapter-ready provider seams
- React/Vite frontend with a premium enterprise UI

## Quick start

On Windows, if `npm` is not on PATH, prepend Node for the current shell:

```powershell
$env:Path='C:\Program Files\nodejs;' + $env:Path
```

1. Copy environment variables:

```bash
cp .env.example .env
```

1. Install dependencies:

```bash
npm install
npm --prefix frontend install
```

1. Start server:

```bash
npm run dev
```

1. Run verification:

```bash
npm test -- --runInBand
npm --prefix frontend run build
```

1. API endpoints:

- `POST /api/auth/register` -> {name, email, password}
- `POST /api/auth/login` -> {email, password}
- `GET /api/companies` -> list companies
- `POST /api/companies` -> create company
- `GET /api/companies/:id` -> get one company
- `PUT /api/companies/:id` -> update company
- `DELETE /api/companies/:id` -> delete company

> All `/api/companies` routes require header `Authorization: Bearer <token>`

## Frontend demo

- `index.html` is the old homepage with 6 sections and navigation.
- `demo.html` is the old static demo form.

## React + Tailwind app (recommended)

1. cd `frontend`
2. npm install
3. npm run dev

The React app includes:

- multipage routing with `react-router-dom`
- shared layout + sticky navigation
- premium landing page, login, admin dashboard, payment flow, and all 12 ERP modules
- refresh-aware API client for authenticated module calls
- Stripe Checkout payment page for live payment collection

## Launch-critical backend

- `GET /api/health` reports database, Stripe, webhook, and auth-secret readiness.
- `GET /api/integrations/status` reports sanitized server-side provider readiness.
- `GET /api/payments/methods` lists available live/mock payment adapters.
- `POST /api/payments/initiate` creates provider-neutral payment requests for Stripe, MTN MoMo, Airtel Money, M-Pesa, or Flutterwave.
- `GET /api/payments/:id` returns one authenticated payment record.
- `POST /api/payments/webhooks/:provider` records adapter webhook payloads for reconciliation.
- `POST /api/demo-request` saves prospect requests and notifies admins.
- `GET /api/admin/demo-requests` requires an authenticated admin email.
- `/api/companies`, `/api/invoices`, `/api/contacts`, `/api/assets`, `/api/transactions`, `/api/deals`, `/api/employees`, `/api/inventory`, `/api/projects`, and `/api/tasks` support the ERP modules.
- `POST /api/invoices/:id/efris-submit` syncs an invoice to the URA EFRIS adapter. Without URA credentials it queues a mock submission instead of claiming a live filing.
- `POST /api/aria/chat` calls Anthropic only when `ANTHROPIC_API_KEY` is configured; otherwise it returns local ARIA intelligence with `mode: "local"`.

## Adapter-ready integrations

Provider secrets and banking credentials are server-only. The frontend receives sanitized readiness labels such as `live`, `test`, `mock`, or `missing`, never secret values.

Supported adapter statuses:

- Stripe Checkout: live/test when Stripe keys are configured; this remains the only fully live payment path by default.
- MTN MoMo, Airtel Money, M-Pesa, Flutterwave: payment requests are queued through adapter records and can run in mock mode while credentials are missing.
- Centenary settlement: represented as server-side settlement configuration only.
- URA EFRIS: stores local VAT/e-invoice records and queues submission/sync through the backend adapter.
- ARIA: uses Anthropic when configured, otherwise local intelligence.

Set `EIC_MOCK_PROVIDERS=false` in production if missing non-Stripe provider credentials should disable those adapters instead of allowing mock queueing.

## Stripe live payments

The production payment path uses Stripe Checkout:

- `GET /api/stripe/config`
- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/webhook`
- `GET /api/stripe/payment-intents`

Before live launch:

1. Activate the Stripe account and complete business verification.
2. Set `STRIPE_SECRET_KEY=sk_live_...` and `STRIPE_PUBLISHABLE_KEY=pk_live_...`.
3. Create a Stripe webhook pointing to `https://your-domain.com/api/stripe/webhook`.
4. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `payment_intent.succeeded`, and `payment_intent.payment_failed`.
5. Set `STRIPE_WEBHOOK_SECRET=whsec_...`.
6. Confirm `/api/health` reports Stripe `live` and webhook `configured`.

## Non-Stripe provider launch checklist

1. Add provider credentials in the production environment, not in source code.
2. Confirm `/api/integrations/status` shows the provider as `configured`.
3. Register provider webhook URLs against `/api/payments/webhooks/:provider`.
4. Run a sandbox collection/disbursement and confirm the payment ledger stores the provider reference and settlement state.
5. Switch provider env values from sandbox to production only after reconciliation is verified.

## Deploy to Vercel (free)

1. Create a Vercel account at https://vercel.com/signup (GitHub login recommended).
2. Install Vercel CLI (optional): `npm i -g vercel`.
3. In repo root run:
   - `vercel login`
   - `vercel` (or `vercel --prod` for production) 
4. When prompted:
   - Project name: `eic-enterprise`
   - Link to existing project (no / yes)
   - Root directory: `.`
   - Build command: `npm --prefix frontend run build`
   - Output directory: `frontend/dist`
   - Install command: `npm install` and `npm --prefix frontend install`
5. The project will produce a deploy URL like `https://eic-enterprise-xxxx.vercel.app`.

### Optional custom domain

- Add `www.eicenterprise.com` in Vercel dashboard > Domains.
- Update DNS A/CNAME as Vercel instructs.
- Set as primary domain.

## Notification settings (registration and inquiry)

The backend sends admin alerts to `innoengola305@gmail.com` (mock sender `eicenterprise@gmail.com`) with phone fallback `+256702977424`.

Config via environment variables:
- `NOTIFY_EMAIL` (default `innoengola305@gmail.com`)
- `PLATFORM_EMAIL` is hardcoded as `eicenterprise@gmail.com` in code.
- `PLATFORM_SMS` is hardcoded as `+256702977424`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` for real email.
- `DISABLE_EMAIL=true` to keep logger-only fallback in dev.


### Notes

- `vercel.json` is already configured with combined backend and frontend routes.
- Use the `api` path in frontend to talk to backend in production, e.g., `fetch('/api/demo-request')`.
- Configure all `.env.example` values in Vercel project environment variables before production.
- Promote to production only after `npm test -- --runInBand`, `npm --prefix frontend run build`, and a live Stripe checkout smoke test pass.


## Notes

- Database file path can be configured with `SQLITE_FILE` in `.env`.
- Change `JWT_SECRET` in `.env` before production.
