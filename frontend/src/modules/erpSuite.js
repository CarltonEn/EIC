export const ERP_MODULES = [
  { name: 'Smart Dashboard', area: 'Executive control', depth: 'KPI cockpit, cash flow, tax mix, live ledgers', status: 'Launch ready' },
  { name: 'ERP Accounting', area: 'Finance', depth: 'GL, P&L, receivables, chart of accounts, journals', status: 'Launch ready' },
  { name: 'EFRIS / Tax', area: 'Compliance', depth: 'VAT, filings, e-invoices, QR validation, countries', status: 'Launch ready' },
  { name: 'Pi Wallet', area: 'Payments', depth: 'Mobile money, requests, settlement, bulk disbursement', status: 'Pilot ready' },
  { name: 'Banking', area: 'Treasury', depth: 'Accounts, transfers, statements, reconciliation', status: 'Pilot ready' },
  { name: 'CRM', area: 'Revenue', depth: 'Contacts, scoring, pipeline, country analytics', status: 'Launch ready' },
  { name: 'HR & Payroll', area: 'People', depth: 'Employees, leave, PAYE/NSSF payroll runs', status: 'Launch ready' },
  { name: 'Inventory', area: 'Operations', depth: 'Stock, reorder levels, purchase orders, supply chain', status: 'Launch ready' },
  { name: 'Projects', area: 'Delivery', depth: 'Projects, tasks, Kanban, status movement, milestones', status: 'Launch ready' },
  { name: 'IT Management', area: 'Assets', depth: 'Assets, security score, licenses, network monitoring', status: 'Pilot ready' },
  { name: 'Crypto & Pi', area: 'Digital assets', depth: 'Rates, portfolio, crypto payments, Pi discounting', status: 'Pilot ready' },
  { name: 'ARIA AI', area: 'Intelligence', depth: 'Financial Q&A, forecasts, tax insights, local fallback', status: 'Launch ready' },
];

export const LAUNCH_WORKFLOWS = [
  'Lead closes in CRM -> EFRIS invoice queued -> provider payment tracked -> ledger reconciles',
  'Inventory reorder threshold -> purchase order -> bank adapter request -> accounting journal',
  'Employee onboarding -> payroll run -> wallet disbursement queue -> PAYE/NSSF compliance',
  'Project milestone -> client billing -> tax adapter sync -> ARIA variance report',
];
