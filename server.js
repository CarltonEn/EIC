require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Stripe = require('stripe');
const {
  getIntegrationStatuses,
  getPaymentMethods,
  getProviderStatus,
  isConfiguredValue,
} = require('./integrations');

const stripe = process.env.STRIPE_SECRET_KEY
  ? Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(503).json({ error: 'Stripe webhook secret is not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      await upsertPaymentFromCheckoutSession(session, event.type);
    }
    if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      await upsertPaymentFromIntent(intent, event.type);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook handling failed:', err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

let dbInitialized = false;
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && !dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to lazy-init DB:', error);
    }
  }
  next();
});

const DB_FILE = process.env.SQLITE_FILE || (process.env.VERCEL ? '/tmp/eic-enterprise.db' : './eic-enterprise.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Unable to open database', err);
    process.exit(1);
  }
});

function runAsync(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getAsync(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allAsync(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function sanitizeText(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function isConfigured(value) {
  return isConfiguredValue(value);
}

const ZERO_DECIMAL_CURRENCIES = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf']);

function currencyMinorFactor(currency = 'usd') {
  return ZERO_DECIMAL_CURRENCIES.has(String(currency).toLowerCase()) ? 1 : 100;
}

function toMinorUnits(amount, currency = 'usd') {
  return Math.round(Number(amount) * currencyMinorFactor(currency));
}

function fromMinorUnits(amount, currency = 'usd') {
  return Number(amount || 0) / currencyMinorFactor(currency);
}

function normalizeCurrency(currency = 'usd') {
  return sanitizeText(currency || 'usd', 10).toLowerCase();
}

function publicPaymentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider || 'stripe',
    providerReference: row.provider_reference || row.stripe_session_id || row.stripe_payment_intent_id || null,
    amount: row.amount,
    amountMajor: fromMinorUnits(row.amount, row.currency),
    currency: row.currency,
    status: row.status,
    providerStatus: row.provider_status || row.status,
    settlementStatus: row.settlement_status || 'pending',
    description: row.description,
    customerEmail: row.customer_email,
    created: Math.floor(new Date(row.created_at).getTime() / 1000),
    updatedAt: row.updated_at || row.created_at,
  };
}

async function createStripeCheckoutSessionForUser(req, input) {
  if (!stripe) {
    const error = new Error('Stripe is not configured');
    error.status = 503;
    throw error;
  }

  const amount = Number(input.amount);
  const currency = normalizeCurrency(input.currency || 'usd');
  const description = sanitizeText(input.description || 'EIC Enterprise payment', 180);
  const customerEmail = sanitizeText(input.customerEmail || req.user.email, 180);
  const origin = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get('host')}`;

  if (!amount || Number.isNaN(amount) || amount <= 0) {
    const error = new Error('A valid amount is required');
    error.status = 400;
    throw error;
  }
  if (!/^[a-z]{3}$/.test(currency)) {
    const error = new Error('A valid 3-letter currency is required');
    error.status = 400;
    throw error;
  }

  const unitAmount = toMinorUnits(amount, currency);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail || undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency,
        unit_amount: unitAmount,
        product_data: {
          name: description,
          description: 'EIC Enterprise ERP platform payment',
        },
      },
    }],
    success_url: `${origin}/payment?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/payment?status=cancelled`,
    metadata: {
      user_id: req.user.id,
      user_email: req.user.email,
      description,
    },
  });

  await runAsync(
    `INSERT INTO payments(id, stripe_session_id, amount, currency, status, description, customer_email, created_by, source, provider, provider_reference, payment_method, channel, provider_status, provider_response, settlement_status, settlement_provider, updated_at)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
    [
      session.id,
      session.id,
      unitAmount,
      currency,
      'checkout_created',
      description,
      customerEmail || null,
      req.user.id,
      'checkout_session_created',
      'stripe',
      session.id,
      'card',
      'checkout',
      'checkout_created',
      JSON.stringify({ mode: 'checkout', url_created: Boolean(session.url) }),
      'pending',
      'stripe',
    ]
  );

  return { id: session.id, url: session.url, provider: 'stripe', status: 'checkout_created', mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test' };
}

async function ensureColumn(table, column, definition) {
  const columns = await allAsync(`PRAGMA table_info(${table})`);
  if (!columns.some(col => col.name === column)) {
    await runAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function localAriaReply(query = '') {
  const q = String(query).toLowerCase();
  if (q.includes('revenue')) {
    return 'Revenue is tracking at UGX 48.2M in the current EIC demo set, with services contributing the largest share. Stripe-confirmed payments are reconciled in the payment ledger, while mobile money adapters remain queued or mock until credentials are configured.';
  }
  if (q.includes('tax') || q.includes('vat') || q.includes('efris')) {
    return 'EFRIS is adapter-ready. Local invoices calculate VAT at 18%, store QR/status fields, and can be submitted to the URA adapter. When URA credentials are missing, submissions are queued in mock mode instead of pretending a live filing occurred.';
  }
  if (q.includes('payment') || q.includes('momo') || q.includes('airtel') || q.includes('mpesa')) {
    return 'Stripe Checkout is the live payment path when configured. MTN MoMo, Airtel Money, M-Pesa, Flutterwave, and Centenary settlement use backend-only adapters with mock queuing until their server credentials are supplied.';
  }
  if (q.includes('secret') || q.includes('bank') || q.includes('settlement')) {
    return 'Settlement details are treated as server-only configuration. The frontend should show readiness and masked labels only; account credentials must stay in environment variables or provider vaults.';
  }
  return 'ARIA is running in local intelligence mode. I can summarize EIC revenue, tax, payment, CRM, and operational data from the app while Anthropic credentials are not configured server-side.';
}

async function callAria(messages) {
  const safeMessages = messages
    .filter(message => ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
    .map(message => ({ role: message.role, content: message.content.slice(0, 4000) }));
  const lastUser = [...safeMessages].reverse().find(message => message.role === 'user');

  if (!isConfigured(process.env.ANTHROPIC_API_KEY)) {
    return {
      reply: localAriaReply(lastUser?.content),
      mode: 'local',
      degraded: true,
      reason: 'ANTHROPIC_API_KEY is not configured; using local ARIA intelligence.',
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 900,
        system: 'You are ARIA, the EIC Enterprise finance and operations assistant. Keep answers practical, concise, and clear about whether provider integrations are live, configured, queued, or mock.',
        messages: safeMessages,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || 'Anthropic request failed');
    }
    const reply = data.content?.find(part => part.type === 'text')?.text || localAriaReply(lastUser?.content);
    return { reply, mode: 'anthropic', degraded: false };
  } catch (error) {
    return {
      reply: localAriaReply(lastUser?.content),
      mode: 'local',
      degraded: true,
      reason: `Anthropic call failed; using local ARIA intelligence. ${error.message}`,
    };
  }
}

async function upsertPaymentFromCheckoutSession(session, eventType = 'checkout.session.completed') {
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;
  const id = session.id || paymentIntentId || uuidv4();
  await runAsync(
    `INSERT INTO payments(id, stripe_session_id, stripe_payment_intent_id, amount, currency, status, description, customer_email, created_by, source, raw_event)
     VALUES(?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       stripe_session_id=excluded.stripe_session_id,
       stripe_payment_intent_id=excluded.stripe_payment_intent_id,
       amount=excluded.amount,
       currency=excluded.currency,
       status=excluded.status,
       description=excluded.description,
       customer_email=excluded.customer_email,
       raw_event=excluded.raw_event`,
    [
      id,
      session.id || null,
      paymentIntentId || null,
      Number(session.amount_total || 0),
      session.currency || 'usd',
      session.payment_status || session.status || 'unknown',
      session.metadata?.description || session.custom_text?.submit?.message || 'EIC Enterprise payment',
      session.customer_details?.email || session.customer_email || null,
      session.metadata?.user_id || null,
      eventType,
      JSON.stringify({ id: session.id, mode: session.mode, payment_status: session.payment_status }),
    ]
  );
}

async function upsertPaymentFromIntent(intent, eventType = 'payment_intent.succeeded') {
  await runAsync(
    `INSERT INTO payments(id, stripe_payment_intent_id, amount, currency, status, description, customer_email, created_by, source, raw_event)
     VALUES(?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       stripe_payment_intent_id=excluded.stripe_payment_intent_id,
       amount=excluded.amount,
       currency=excluded.currency,
       status=excluded.status,
       description=excluded.description,
       raw_event=excluded.raw_event`,
    [
      intent.id,
      intent.id,
      Number(intent.amount_received || intent.amount || 0),
      intent.currency || 'usd',
      intent.status || 'unknown',
      intent.description || 'EIC Enterprise payment',
      intent.receipt_email || null,
      intent.metadata?.user_id || null,
      eventType,
      JSON.stringify({ id: intent.id, status: intent.status }),
    ]
  );
}

const REFRESH_SECRET = process.env.REFRESH_SECRET || require('crypto').randomBytes(32).toString('hex');

async function initDb() {
  await runAsync(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email_confirmed INTEGER DEFAULT 0,
      confirm_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      industry TEXT,
      website TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS demo_requests (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT NOT NULL,
      challenge TEXT NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      stripe_session_id TEXT,
      stripe_payment_intent_id TEXT,
      amount INTEGER NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'usd',
      status TEXT DEFAULT 'pending',
      description TEXT,
      customer_email TEXT,
      created_by TEXT,
      source TEXT,
      raw_event TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'UGX',
      method TEXT,
      status TEXT DEFAULT 'pending',
      reference TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE,
      client_name TEXT NOT NULL,
      client_email TEXT,
      amount REAL NOT NULL,
      vat_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      currency TEXT DEFAULT 'UGX',
      status TEXT DEFAULT 'draft',
      efris_status TEXT DEFAULT 'pending',
      efris_qr TEXT,
      due_date TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      country TEXT DEFAULT 'Uganda',
      lead_score INTEGER DEFAULT 50,
      lifetime_value REAL DEFAULT 0,
      pipeline_stage TEXT DEFAULT 'Lead',
      status TEXT DEFAULT 'Active',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      tag TEXT UNIQUE,
      name TEXT NOT NULL,
      type TEXT,
      department TEXT,
      assigned_to TEXT,
      status TEXT DEFAULT 'Active',
      warranty_expiry TEXT,
      purchase_cost REAL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      reference TEXT,
      account_code TEXT,
      account_name TEXT,
      description TEXT,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      bank TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      emp_id TEXT UNIQUE,
      name TEXT NOT NULL,
      department TEXT,
      role TEXT,
      email TEXT,
      phone TEXT,
      salary REAL DEFAULT 0,
      currency TEXT DEFAULT 'UGX',
      status TEXT DEFAULT 'Active',
      leave_days INTEGER DEFAULT 14,
      joined_date TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      leave_type TEXT DEFAULT 'Annual Leave',
      from_date TEXT,
      to_date TEXT,
      days INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Pending',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE,
      name TEXT NOT NULL,
      category TEXT,
      stock INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 10,
      unit_price REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'In Stock',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT UNIQUE,
      supplier TEXT NOT NULL,
      items TEXT,
      amount REAL DEFAULT 0,
      currency TEXT DEFAULT 'UGX',
      status TEXT DEFAULT 'Pending',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Active',
      start_date TEXT,
      due_date TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      company TEXT,
      contact TEXT,
      value REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      stage TEXT DEFAULT 'Lead',
      probability INTEGER DEFAULT 10,
      close_date TEXT,
      owner TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      task_id TEXT UNIQUE,
      title TEXT NOT NULL,
      project_id TEXT,
      project TEXT,
      assignee TEXT,
      priority TEXT DEFAULT 'Medium',
      due_date TEXT,
      status TEXT DEFAULT 'Todo',
      progress INTEGER DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      event_type TEXT,
      provider_event_id TEXT,
      signature_valid INTEGER DEFAULT 0,
      status TEXT DEFAULT 'recorded',
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runAsync(`
    CREATE TABLE IF NOT EXISTS integration_events (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      event_type TEXT NOT NULL,
      status TEXT DEFAULT 'recorded',
      payment_id TEXT,
      invoice_id TEXT,
      payload TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  await ensureColumn('payments', 'provider', "TEXT DEFAULT 'stripe'");
  await ensureColumn('payments', 'provider_reference', 'TEXT');
  await ensureColumn('payments', 'payment_method', 'TEXT');
  await ensureColumn('payments', 'channel', 'TEXT');
  await ensureColumn('payments', 'provider_status', 'TEXT');
  await ensureColumn('payments', 'provider_response', 'TEXT');
  await ensureColumn('payments', 'settlement_status', "TEXT DEFAULT 'pending'");
  await ensureColumn('payments', 'settlement_provider', 'TEXT');
  await ensureColumn('payments', 'settlement_reference', 'TEXT');
  await ensureColumn('payments', 'updated_at', 'DATETIME');

  await ensureColumn('invoices', 'efris_reference', 'TEXT');
  await ensureColumn('invoices', 'efris_provider_status', 'TEXT');
  await ensureColumn('invoices', 'efris_provider_response', 'TEXT');
  await ensureColumn('invoices', 'efris_submitted_at', 'DATETIME');
  await ensureColumn('invoices', 'efris_last_sync_at', 'DATETIME');
}

const ADMIN_NOTIFICATION_EMAIL = process.env.NOTIFY_EMAIL || 'innoengola305@gmail.com';
const PLATFORM_EMAIL = 'eicenterprise@gmail.com';
const PLATFORM_SMS = '+256702977424';

let mailTransport;

function getMailTransport() {
  if (!mailTransport) {
    mailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER || 'smtp-user',
        pass: process.env.SMTP_PASS || 'smtp-pass',
      },
    });
  }
  return mailTransport;
}

async function sendNotification(subject, html) {
  try {
    if (process.env.DISABLE_EMAIL === 'true') {
      console.log('[Notification blocked] subject=', subject);
      return;
    }

    const transport = getMailTransport();

    const mail = {
      from: `EIC Enterprise <${PLATFORM_EMAIL}>`,
      to: ADMIN_NOTIFICATION_EMAIL,
      subject,
      html,
    };

    const result = await transport.sendMail(mail);
    console.log('Notification email sent:', result.messageId);
  } catch (e) {
    console.error('Failed to send notification email; mocking details below.');
    console.error('Subject:', subject);
    console.error('Body:', html);
    console.error('Admin email:', ADMIN_NOTIFICATION_EMAIL);
    console.error('Fallback phone message: Call', PLATFORM_SMS);
  }
}

async function sendWelcomeEmail(email, name) {
  try {
    if (process.env.DISABLE_EMAIL === 'true') {
      console.log('[Welcome email blocked] user=', email);
      return;
    }

    const transport = getMailTransport();
    const welcomeMail = {
      from: `EIC Enterprise <${PLATFORM_EMAIL}>`,
      to: email,
      subject: 'Welcome to EIC Enterprise',
      html: `<p>Hi ${name},</p><p>Thank you for registering with EIC Enterprise! We’re thrilled to have you on board. You can now access the admin dashboard and submit demo requests instantly.</p><p>Best regards,<br />The EIC Enterprise Team</p>`,
    };

    const result = await transport.sendMail(welcomeMail);
    console.log('Welcome email sent to user:', email, result.messageId);
  } catch (err) {
    console.error('Failed to send welcome email to user', email, err);
  }
}

function generateAccessToken(user) {
  const payload = { id: user.id, email: user.email, name: user.name };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

async function generateRefreshToken(userId) {
  const token = require('crypto').randomBytes(40).toString('hex');
  const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await runAsync(
    'INSERT INTO refresh_tokens(id, user_id, token_hash, expires_at) VALUES(?,?,?,?)',
    [id, userId, tokenHash, expiresAt]
  );
  return token;
}

async function getUserByEmail(email) {
  return await getAsync('SELECT * FROM users WHERE email = ?', [email]);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await runAsync(
      'INSERT INTO users(id, name, email, password_hash) VALUES(?, ?, ?, ?)',
      [id, name, email, password_hash]
    );

    const accessToken = generateAccessToken({ id, name, email });
    const refreshToken = await generateRefreshToken(id);

    await sendNotification(
      'New user registration at EIC Enterprise',
      `<p>New user registered:</p><ul><li>Name: ${name}</li><li>Email: ${email}</li></ul>`
    );

    await sendWelcomeEmail(email, name);

    res.status(201).json({ user: { id, name, email }, token: accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user.id);

    await sendNotification(
      'User logged in to EIC Enterprise',
      `<p>User logged in:</p><ul><li>Name: ${user.name}</li><li>Email: ${user.email}</li></ul>`
    );

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token: accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
    const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
    const record = await getAsync(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > datetime("now")',
      [tokenHash]
    );
    if (!record) return res.status(401).json({ error: 'Invalid or expired refresh token' });
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [record.user_id]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    await runAsync('DELETE FROM refresh_tokens WHERE id = ?', [record.id]);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user.id);
    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const tokenHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
      await runAsync('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await getAsync('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const dbRow = await getAsync('SELECT 1 as ok');
    const integrations = getIntegrationStatuses();
    res.json({
      status: 'ok',
      app: 'EIC Enterprise',
      database: dbRow?.ok === 1 ? 'ready' : 'unknown',
      stripe: {
        configured: Boolean(stripe),
        mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'not_configured',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ? 'live' : process.env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') ? 'test' : 'not_configured',
        webhook: isConfigured(process.env.STRIPE_WEBHOOK_SECRET) ? 'configured' : 'missing',
      },
      auth: {
        jwtSecret: isConfigured(process.env.JWT_SECRET) ? 'configured' : 'ephemeral',
        refreshSecret: isConfigured(process.env.REFRESH_SECRET) ? 'configured' : 'ephemeral',
      },
      integrations,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Health check failed' });
  }
});

app.get('/api/integrations/status', async (req, res) => {
  res.json({
    mockProviders: process.env.EIC_MOCK_PROVIDERS !== 'false',
    providers: getIntegrationStatuses(),
  });
});

app.get('/api/payments/methods', async (req, res) => {
  res.json(getPaymentMethods());
});

app.post('/api/payments/initiate', authMiddleware, async (req, res) => {
  try {
    const provider = sanitizeText(req.body.provider || 'stripe', 40).toLowerCase();
    const methods = getPaymentMethods();
    const method = methods.find(item => item.id === provider);
    if (!method) {
      return res.status(400).json({ error: 'Unsupported payment provider' });
    }

    const amount = Number(req.body.amount);
    const currency = normalizeCurrency(req.body.currency || method.currencies[0] || 'ugx');
    const description = sanitizeText(req.body.description || `${method.label} payment`, 180);
    const customerEmail = sanitizeText(req.body.customerEmail || req.user.email, 180);
    const customerPhone = sanitizeText(req.body.customerPhone || req.body.phone || '', 40);

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'A valid amount is required' });
    }
    if (!/^[a-z]{3}$/.test(currency)) {
      return res.status(400).json({ error: 'A valid 3-letter currency is required' });
    }
    if (!method.currencies.includes(currency)) {
      return res.status(400).json({ error: `${method.label} does not support ${currency.toUpperCase()}` });
    }

    if (provider === 'stripe' && method.configured) {
      const checkout = await createStripeCheckoutSessionForUser(req, { amount, currency, description, customerEmail });
      return res.status(201).json({
        ...checkout,
        redirectUrl: checkout.url,
        nextAction: 'redirect_to_checkout',
      });
    }

    if (!method.available) {
      return res.status(503).json({ error: method.message });
    }

    const status = method.configured ? 'queued' : 'mock_queued';
    const id = `pay_${uuidv4()}`;
    const providerReference = `${provider.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-${Date.now()}`;
    const amountMinor = toMinorUnits(amount, currency);
    const providerResponse = {
      provider,
      mode: method.mode,
      configured: method.configured,
      message: method.configured
        ? `${method.label} adapter accepted the request for provider-side processing.`
        : `${method.label} mock adapter queued the request; add server credentials to enable live calls.`,
    };
    const settlement = getProviderStatus('centenary_settlement');
    const settlementStatus = settlement?.configured ? 'pending' : method.mode === 'mock' ? 'mock_pending' : 'configuration_required';

    await runAsync(
      `INSERT INTO payments(id, amount, currency, status, description, customer_email, created_by, source, provider, provider_reference, payment_method, channel, provider_status, provider_response, settlement_status, settlement_provider, settlement_reference, updated_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
      [
        id,
        amountMinor,
        currency,
        status,
        description,
        customerEmail || null,
        req.user.id,
        method.configured ? 'provider_adapter' : 'mock_provider_adapter',
        provider,
        providerReference,
        provider,
        req.body.channel || 'api',
        status,
        JSON.stringify(providerResponse),
        settlementStatus,
        'centenary_settlement',
        null,
      ]
    );

    await runAsync(
      'INSERT INTO transactions(id, type, description, amount, currency, method, status, reference, created_by) VALUES(?,?,?,?,?,?,?,?,?)',
      [uuidv4(), 'payment', description, amount, currency.toUpperCase(), method.label, status, providerReference, req.user.id]
    );

    await runAsync(
      'INSERT INTO integration_events(id, provider, event_type, status, payment_id, payload, created_by) VALUES(?,?,?,?,?,?,?)',
      [uuidv4(), provider, 'payment_initiated', status, id, JSON.stringify(providerResponse), req.user.id]
    );

    const row = await getAsync('SELECT * FROM payments WHERE id = ?', [id]);
    res.status(method.configured ? 202 : 201).json({
      payment: publicPaymentRow(row),
      mode: method.mode,
      nextAction: method.configured ? 'await_provider_callback' : 'mock_provider_callback',
      message: providerResponse.message,
    });
  } catch (err) {
    console.error('Provider-neutral payment initiation failed:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to initiate payment' });
  }
});

app.post('/api/payments/webhooks/:provider', async (req, res) => {
  try {
    const provider = sanitizeText(req.params.provider || '', 40).toLowerCase();
    const known = getIntegrationStatuses().some(item => item.id === provider);
    if (!known) {
      return res.status(404).json({ error: 'Unknown webhook provider' });
    }

    const payload = req.body || {};
    const providerEventId = sanitizeText(payload.id || payload.event_id || payload.reference || '', 120);
    const eventType = sanitizeText(payload.type || payload.event || payload.status || 'provider_webhook', 120);
    const signatureHeader = req.headers['x-eic-signature'] || req.headers['x-signature'] || req.headers['verif-hash'];
    const signatureValid = Boolean(signatureHeader);

    const eventId = uuidv4();
    await runAsync(
      'INSERT INTO webhook_events(id, provider, event_type, provider_event_id, signature_valid, status, payload) VALUES(?,?,?,?,?,?,?)',
      [eventId, provider, eventType, providerEventId || null, signatureValid ? 1 : 0, 'recorded', JSON.stringify(payload)]
    );

    const paymentId = sanitizeText(payload.payment_id || payload.paymentId || '', 120);
    const providerReference = sanitizeText(payload.provider_reference || payload.reference || '', 120);
    const status = sanitizeText(payload.status || payload.payment_status || '', 40);
    if (status && (paymentId || providerReference)) {
      await runAsync(
        `UPDATE payments SET status = ?, provider_status = ?, provider_response = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? OR provider_reference = ?`,
        [status, status, JSON.stringify(payload), paymentId || '__none__', providerReference || '__none__']
      );
    }

    res.json({
      received: true,
      provider,
      eventId,
      signature: signatureValid ? 'present' : 'missing',
      status: 'recorded',
    });
  } catch (err) {
    console.error('Provider webhook handling failed:', err);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

app.get('/api/payments/:id', authMiddleware, async (req, res) => {
  try {
    const row = await getAsync(
      `SELECT * FROM payments
       WHERE created_by = ? AND (id = ? OR stripe_session_id = ? OR stripe_payment_intent_id = ? OR provider_reference = ?)`,
      [req.user.id, req.params.id, req.params.id, req.params.id, req.params.id]
    );
    if (!row) return res.status(404).json({ error: 'Payment not found' });
    res.json(publicPaymentRow(row));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch payment' });
  }
});

app.get('/api/companies', authMiddleware, async (req, res) => {
  try {
    const companies = await allAsync('SELECT * FROM companies WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch companies' });
  }
});

app.post('/api/companies', authMiddleware, async (req, res) => {
  try {
    const { name, address, industry, website } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const id = uuidv4();
    await runAsync(
      'INSERT INTO companies(id, name, address, industry, website, created_by) VALUES(?, ?, ?, ?, ?, ?)',
      [id, name, address || null, industry || null, website || null, req.user.id]
    );

    const company = await getAsync('SELECT * FROM companies WHERE id = ?', [id]);
    res.status(201).json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to create company' });
  }
});

app.get('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    const company = await getAsync('SELECT * FROM companies WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch company' });
  }
});

app.put('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    const { name, address, industry, website } = req.body;
    const company = await getAsync('SELECT * FROM companies WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await runAsync(
      'UPDATE companies SET name = ?, address = ?, industry = ?, website = ? WHERE id = ? AND created_by = ?',
      [name || company.name, address !== undefined ? address : company.address, industry !== undefined ? industry : company.industry, website !== undefined ? website : company.website, req.params.id, req.user.id]
    );

    const updated = await getAsync('SELECT * FROM companies WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to update company' });
  }
});

app.delete('/api/companies/:id', authMiddleware, async (req, res) => {
  try {
    const company = await getAsync('SELECT * FROM companies WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await runAsync('DELETE FROM companies WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to delete company' });
  }
});

app.post('/api/demo-request', async (req, res) => {
  try {
    const { fullName, email, company, challenge, message } = req.body;
    if (!fullName || !email || !company || !challenge) {
      return res.status(400).json({ error: 'fullName, email, company, and challenge are required.' });
    }

    const id = uuidv4();
    await runAsync(
      'INSERT INTO demo_requests(id, full_name, email, company, challenge, message) VALUES(?, ?, ?, ?, ?, ?)',
      [id, fullName, email, company, challenge, message || null]
    );

    await sendNotification(
      'New demo request received at EIC Enterprise',
      `<p>New demo request:</p><ul><li>Name: ${fullName}</li><li>Email: ${email}</li><li>Company: ${company}</li><li>Challenge: ${challenge}</li><li>Message: ${message || '(none)'}</li><li>Platform contact: ${PLATFORM_EMAIL}</li><li>Phone alerts: ${PLATFORM_SMS}</li></ul>`
    );

    return res.status(201).json({ id, fullName, email, company, challenge, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save demo request' });
  }
});

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'innoengola305@gmail.com,eicenterprise@gmail.com').split(',');
function adminMiddleware(req, res, next) {
  if (!req.user || !ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

app.get('/api/admin/demo-requests', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const requests = await allAsync('SELECT * FROM demo_requests ORDER BY created_at DESC');
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Unable to fetch demo requests' });
  }
});

app.post('/api/twilio/sms-webhook', async (req, res) => {
  const from = req.body.From || req.body.from || 'unknown';
  const to = req.body.To || req.body.to || 'unknown';
  const body = req.body.Body || req.body.body || '';

  console.log('Incoming Twilio SMS', { from, to, body });

  await sendNotification(
    `Twilio SMS from ${from}`,
    `<p>Incoming SMS received by Twilio webhook:</p><ul><li>From: ${from}</li><li>To: ${to}</li><li>Body: ${body}</li></ul>`
  ).catch((error) => {
    console.error('Failed to send Twilio SMS notification', error);
  });

  res.set('Content-Type', 'text/xml');
  res.send('<Response><Message>Thanks for your message. We will follow up shortly.</Message></Response>');
});

app.get('/api/stripe/config', (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    return res.status(503).json({ error: 'Stripe publishable key is not configured' });
  }
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    mode: process.env.STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_') ? 'live' : 'test',
  });
});

app.post('/api/stripe/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const checkout = await createStripeCheckoutSessionForUser(req, req.body);
    res.status(201).json({ id: checkout.id, url: checkout.url });
  } catch (err) {
    console.error('Stripe create-checkout-session error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

app.post('/api/stripe/create-payment-intent', authMiddleware, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }
  try {
    const { amount, currency = 'usd', description } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'A valid amount is required' });
    }
    const normalizedCurrency = normalizeCurrency(currency);
    const amountInCents = toMinorUnits(parseFloat(amount), normalizedCurrency);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: normalizedCurrency,
      description: description || 'EIC Enterprise payment',
      metadata: {
        user_id: req.user.id,
        user_email: req.user.email,
      },
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error('Stripe create-payment-intent error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment intent' });
  }
});

app.get('/api/stripe/payment-intents', authMiddleware, async (req, res) => {
  if (!stripe) {
    try {
      const rows = await allAsync('SELECT * FROM payments WHERE created_by = ? ORDER BY created_at DESC LIMIT ?', [req.user.id, Math.min(parseInt(req.query.limit) || 10, 100)]);
      return res.json(rows.map(publicPaymentRow));
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Failed to fetch payments' });
    }
  }
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const stored = await allAsync('SELECT * FROM payments WHERE created_by = ? ORDER BY created_at DESC LIMIT ?', [req.user.id, limit]);
    if (stored.length > 0) {
      return res.json(stored.map(publicPaymentRow));
    }
    const list = await stripe.paymentIntents.list({ limit });
    res.json(list.data.filter(pi => !pi.metadata?.user_id || pi.metadata.user_id === req.user.id).map(pi => ({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      status: pi.status,
      description: pi.description,
      created: pi.created,
    })));
  } catch (err) {
    console.error('Stripe list payment intents error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch payment intents' });
  }
});

app.post('/api/aria/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }
    const result = await callAria(messages);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM invoices WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/invoices', authMiddleware, async (req, res) => {
  try {
    const { client_name, client_email, currency, due_date } = req.body;
    const amount = Number(req.body.amount);
    if (!client_name || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'client_name and a positive amount are required' });
    }
    const id = uuidv4();
    const vat = amount * 0.18;
    const total = amount + vat;
    const num = `EFRIS-${String(Date.now()).slice(-6)}`;
    await runAsync(
      'INSERT INTO invoices (id, invoice_number, client_name, client_email, amount, vat_amount, total_amount, currency, due_date, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, num, client_name, client_email, amount, vat, total, currency || 'UGX', due_date, req.user.id]
    );
    const inv = await getAsync('SELECT * FROM invoices WHERE id = ?', [id]);
    res.status(201).json(inv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/invoices/:id/efris-submit', authMiddleware, async (req, res) => {
  try {
    const invoice = await getAsync('SELECT * FROM invoices WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const status = getProviderStatus('ura_efris');
    const configured = Boolean(status?.configured);
    const reference = invoice.efris_reference || `${configured ? 'URA' : 'MOCK-URA'}-${String(Date.now()).slice(-8)}`;
    const efrisStatus = configured ? 'submitted' : 'queued';
    const providerResponse = {
      provider: 'ura_efris',
      mode: status?.mode || 'missing',
      configured,
      reference,
      message: configured
        ? 'URA EFRIS adapter accepted the invoice for server-side submission.'
        : 'URA EFRIS credentials are missing; invoice is queued in mock mode.',
    };

    await runAsync(
      `UPDATE invoices
       SET efris_status = ?, efris_reference = ?, efris_provider_status = ?, efris_provider_response = ?,
           efris_submitted_at = COALESCE(efris_submitted_at, CURRENT_TIMESTAMP),
           efris_last_sync_at = CURRENT_TIMESTAMP,
           status = CASE WHEN status = 'draft' THEN 'pending' ELSE status END
       WHERE id = ? AND created_by = ?`,
      [efrisStatus, reference, efrisStatus, JSON.stringify(providerResponse), req.params.id, req.user.id]
    );

    await runAsync(
      'INSERT INTO integration_events(id, provider, event_type, status, invoice_id, payload, created_by) VALUES(?,?,?,?,?,?,?)',
      [uuidv4(), 'ura_efris', 'invoice_submit', efrisStatus, invoice.id, JSON.stringify(providerResponse), req.user.id]
    );

    const updated = await getAsync('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    res.status(configured ? 202 : 200).json({
      invoice: updated,
      mode: status?.mode || 'mock',
      message: providerResponse.message,
    });
  } catch (err) {
    console.error('EFRIS submit failed:', err);
    res.status(500).json({ error: err.message || 'EFRIS submission failed' });
  }
});

app.put('/api/invoices/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM invoices WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    const { status } = req.body;
    await runAsync('UPDATE invoices SET status=? WHERE id=? AND created_by=?', [status || 'pending', req.params.id, req.user.id]);
    const inv = await getAsync('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    res.json(inv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/invoices/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM invoices WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('DELETE FROM invoices WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/contacts', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM contacts WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/contacts', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, company, country, pipeline_stage } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const id = uuidv4();
    await runAsync(
      'INSERT INTO contacts (id, name, email, phone, company, country, pipeline_stage, created_by) VALUES (?,?,?,?,?,?,?,?)',
      [id, name, email || null, phone || null, company || null, country || 'Uganda', pipeline_stage || 'Lead', req.user.id]
    );
    const contact = await getAsync('SELECT * FROM contacts WHERE id = ?', [id]);
    res.status(201).json(contact);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM contacts WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    const { name, email, phone, company, country, pipeline_stage } = req.body;
    await runAsync(
      'UPDATE contacts SET name=?, email=?, phone=?, company=?, country=?, pipeline_stage=? WHERE id=? AND created_by=?',
      [name, email, phone, company, country, pipeline_stage, req.params.id, req.user.id]
    );
    const contact = await getAsync('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    res.json(contact);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM contacts WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('DELETE FROM contacts WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/assets', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM assets WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/assets', authMiddleware, async (req, res) => {
  try {
    const { name, type, department, assigned_to, warranty_expiry, purchase_cost } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const id = uuidv4();
    const tag = `IT-${String(Date.now()).slice(-4)}`;
    await runAsync(
      'INSERT INTO assets (id, tag, name, type, department, assigned_to, warranty_expiry, purchase_cost, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, tag, name, type || null, department || null, assigned_to || null, warranty_expiry || null, purchase_cost || 0, req.user.id]
    );
    const asset = await getAsync('SELECT * FROM assets WHERE id = ?', [id]);
    res.status(201).json(asset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/assets/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM assets WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    const { name, type, department, assigned_to, warranty_expiry, purchase_cost, status } = req.body;
    await runAsync(
      'UPDATE assets SET name=?, type=?, department=?, assigned_to=?, warranty_expiry=?, purchase_cost=?, status=? WHERE id=? AND created_by=?',
      [name, type, department, assigned_to, warranty_expiry, purchase_cost, status, req.params.id, req.user.id]
    );
    const asset = await getAsync('SELECT * FROM assets WHERE id = ?', [req.params.id]);
    res.json(asset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/assets/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM assets WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('DELETE FROM assets WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM transactions WHERE created_by = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const { type, description, currency, method, reference } = req.body;
    const amount = Number(req.body.amount);
    if (!type || isNaN(amount)) {
      return res.status(400).json({ error: 'type and numeric amount are required' });
    }
    const id = uuidv4();
    await runAsync(
      'INSERT INTO transactions (id, type, description, amount, currency, method, reference, status, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, type, description, amount, currency || 'UGX', method, reference, 'completed', req.user.id]
    );
    res.json({ id, type, amount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/journal-entries', authMiddleware, async (req, res) => {
  try {
    const { account_code, account_name, description, bank } = req.body;
    const debit = Number(req.body.debit) || 0;
    const credit = Number(req.body.credit) || 0;
    const id = uuidv4();
    const ref = `JE-${String(Date.now()).slice(-4)}`;
    await runAsync(
      'INSERT INTO journal_entries (id, reference, account_code, account_name, description, debit, credit, bank, created_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [id, ref, account_code, account_name, description, debit || 0, credit || 0, bank, req.user.id]
    );
    res.json({ id, reference: ref });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/journal-entries', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM journal_entries WHERE created_by = ? ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Deals API (CRM) ─── */
app.get('/api/deals', authMiddleware, async (req, res) => {
  try {
    const { stage } = req.query;
    let sql = 'SELECT * FROM deals WHERE created_by = ?';
    const params = [req.user.id];
    if (stage) { sql += ' AND stage = ?'; params.push(stage); }
    sql += ' ORDER BY created_at DESC';
    res.json(await allAsync(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/deals', authMiddleware, async (req, res) => {
  try {
    const { title, company, contact, value, currency, stage, probability, close_date, owner } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const id = uuidv4();
    await runAsync(
      'INSERT INTO deals(id, title, company, contact, value, currency, stage, probability, close_date, owner, created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      [id, title, company || null, contact || null, Number(value) || 0, currency || 'USD', stage || 'Lead', Number(probability) || 10, close_date || null, owner || null, req.user.id]
    );
    const deal = await getAsync('SELECT * FROM deals WHERE id = ?', [id]);
    res.status(201).json(deal);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/deals/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM deals WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    const { title, company, contact, value, currency, stage, probability, close_date, owner } = req.body;
    await runAsync(
      'UPDATE deals SET title=?, company=?, contact=?, value=?, currency=?, stage=?, probability=?, close_date=?, owner=? WHERE id=? AND created_by=?',
      [title, company, contact, Number(value) || 0, currency, stage, Number(probability) || 0, close_date, owner, req.params.id, req.user.id]
    );
    const deal = await getAsync('SELECT * FROM deals WHERE id = ?', [req.params.id]);
    res.json(deal);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/deals/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM deals WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('DELETE FROM deals WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── HR API ─── */
app.get('/api/employees', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM employees WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/employees', authMiddleware, async (req, res) => {
  try {
    const { name, department, role, email, phone, salary, currency, joined_date } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const id = uuidv4();
    const count = await getAsync('SELECT COUNT(*) as c FROM employees WHERE created_by = ?', [req.user.id]);
    const emp_id = `EMP-${String((count.c || 0) + 1).padStart(3, '0')}`;
    const statusVal = 'Active';
    await runAsync(
      'INSERT INTO employees(id, emp_id, name, department, role, email, phone, salary, currency, status, joined_date, created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
      [id, emp_id, name, department || null, role || null, email || null, phone || null, salary || 0, currency || 'UGX', statusVal, joined_date || null, req.user.id]
    );
    const emp = await getAsync('SELECT * FROM employees WHERE id = ?', [id]);
    res.status(201).json(emp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/employees/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM employees WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    const { name, department, role, email, phone, salary, status } = req.body;
    await runAsync(
      'UPDATE employees SET name=?, department=?, role=?, email=?, phone=?, salary=?, status=? WHERE id=? AND created_by=?',
      [name, department, role, email, phone, salary, status, req.params.id, req.user.id]
    );
    const emp = await getAsync('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    res.json(emp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM employees WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('DELETE FROM employees WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leave-requests', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM leave_requests WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leave-requests', authMiddleware, async (req, res) => {
  try {
    const { employee_id, employee_name, leave_type, from_date, to_date, days } = req.body;
    if (!employee_name || !from_date) return res.status(400).json({ error: 'employee_name and from_date required' });
    const id = uuidv4();
    await runAsync(
      'INSERT INTO leave_requests(id, employee_id, employee_name, leave_type, from_date, to_date, days, created_by) VALUES(?,?,?,?,?,?,?,?)',
      [id, employee_id || null, employee_name, leave_type || 'Annual Leave', from_date, to_date || from_date, days || 1, req.user.id]
    );
    const leaveReq = await getAsync('SELECT * FROM leave_requests WHERE id = ?', [id]);
    res.status(201).json(leaveReq);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leave-requests/:id/approve', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM leave_requests WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('UPDATE leave_requests SET status=? WHERE id=? AND created_by=?', ['Approved', req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leave-requests/:id/decline', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM leave_requests WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('UPDATE leave_requests SET status=? WHERE id=? AND created_by=?', ['Declined', req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Inventory API ─── */
app.get('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM inventory_items WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const { name, category, stock, reorder_level, unit_price, currency } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const id = uuidv4();
    const count = await getAsync('SELECT COUNT(*) as c FROM inventory_items WHERE created_by = ?', [req.user.id]);
    const sku = `PRD-${String((count.c || 0) + 1).padStart(3, '0')}`;
    const stockNum = Number(stock) || 0;
    const reorder = Number(reorder_level) || 10;
    const status = stockNum === 0 ? 'Out of Stock' : stockNum <= reorder ? (stockNum <= Math.floor(reorder * 0.5) ? 'Critical' : 'Low Stock') : 'In Stock';
    await runAsync(
      'INSERT INTO inventory_items(id, sku, name, category, stock, reorder_level, unit_price, currency, status, created_by) VALUES(?,?,?,?,?,?,?,?,?,?)',
      [id, sku, name, category || null, stockNum, reorder, Number(unit_price) || 0, currency || 'USD', status, req.user.id]
    );
    const item = await getAsync('SELECT * FROM inventory_items WHERE id = ?', [id]);
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/inventory/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM inventory_items WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    const { name, category, stock, reorder_level, unit_price, status } = req.body;
    const stockNum = Number(stock) || 0;
    const reorder = Number(reorder_level) || 10;
    const computedStatus = status || (stockNum === 0 ? 'Out of Stock' : stockNum <= reorder ? 'Low Stock' : 'In Stock');
    await runAsync(
      'UPDATE inventory_items SET name=?, category=?, stock=?, reorder_level=?, unit_price=?, status=? WHERE id=? AND created_by=?',
      [name, category, stockNum, reorder, unit_price, computedStatus, req.params.id, req.user.id]
    );
    const item = await getAsync('SELECT * FROM inventory_items WHERE id = ?', [req.params.id]);
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/inventory/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM inventory_items WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('DELETE FROM inventory_items WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/purchase-orders', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM purchase_orders WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/purchase-orders', authMiddleware, async (req, res) => {
  try {
    const { supplier, items, amount, currency, status } = req.body;
    if (!supplier) return res.status(400).json({ error: 'supplier is required' });
    const id = uuidv4();
    const count = await getAsync('SELECT COUNT(*) as c FROM purchase_orders WHERE created_by = ?', [req.user.id]);
    const po_number = `PO-${String((count.c || 0) + 1).padStart(4, '0')}`;
    await runAsync(
      'INSERT INTO purchase_orders(id, po_number, supplier, items, amount, currency, status, created_by) VALUES(?,?,?,?,?,?,?,?)',
      [id, po_number, supplier, items || null, Number(amount) || 0, currency || 'UGX', status || 'Pending', req.user.id]
    );
    const po = await getAsync('SELECT * FROM purchase_orders WHERE id = ?', [id]);
    res.status(201).json(po);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── Projects API ─── */
app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM projects WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/projects', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, start_date, due_date } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const id = uuidv4();
    await runAsync(
      'INSERT INTO projects(id, title, description, status, start_date, due_date, created_by) VALUES(?,?,?,?,?,?,?)',
      [id, title, description || null, status || 'Active', start_date || null, due_date || null, req.user.id]
    );
    const proj = await getAsync('SELECT * FROM projects WHERE id = ?', [id]);
    res.status(201).json(proj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    const { title, description, status, start_date, due_date } = req.body;
    await runAsync(
      'UPDATE projects SET title=?, description=?, status=?, start_date=?, due_date=? WHERE id=? AND created_by=?',
      [title, description, status, start_date, due_date, req.params.id, req.user.id]
    );
    const proj = await getAsync('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    res.json(proj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('DELETE FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { project_id, status } = req.query;
    let sql = 'SELECT * FROM tasks WHERE created_by = ?';
    const params = [req.user.id];
    if (project_id) { sql += ' AND project_id = ?'; params.push(project_id); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const rows = await allAsync(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, project_id, project, assignee, priority, due_date, status, progress } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const id = uuidv4();
    const count = await getAsync('SELECT COUNT(*) as c FROM tasks WHERE created_by = ?', [req.user.id]);
    const task_id = `T-${String((count.c || 0) + 1).padStart(3, '0')}`;
    await runAsync(
      'INSERT INTO tasks(id, task_id, title, project_id, project, assignee, priority, due_date, status, progress, created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      [id, task_id, title, project_id || null, project || null, assignee || null, priority || 'Medium', due_date || null, status || 'Todo', Number(progress) || 0, req.user.id]
    );
    const task = await getAsync('SELECT * FROM tasks WHERE id = ?', [id]);
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM tasks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    const { title, assignee, priority, due_date, status, progress } = req.body;
    await runAsync(
      'UPDATE tasks SET title=?, assignee=?, priority=?, due_date=?, status=?, progress=? WHERE id=? AND created_by=?',
      [title, assignee, priority, due_date, status, Number(progress) || 0, req.params.id, req.user.id]
    );
    const task = await getAsync('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await getAsync('SELECT id FROM tasks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!existing) return res.status(403).json({ error: 'Forbidden' });
    await runAsync('DELETE FROM tasks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const fs = require('fs');
const FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(FRONTEND_DIST));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(FRONTEND_DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('EIC Enterprise API is running. Visit /api/companies and /api/auth.');
  }
});

async function startServer() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EIC Enterprise server running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
}

module.exports = app;
module.exports.app = app;
module.exports.initDb = initDb;
module.exports.sendNotification = sendNotification;
module.exports.upsertPaymentFromCheckoutSession = upsertPaymentFromCheckoutSession;
module.exports.upsertPaymentFromIntent = upsertPaymentFromIntent;
