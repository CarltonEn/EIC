import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch } from './api';

const currencies = [
  { value: 'usd', label: 'USD - US Dollar' },
  { value: 'ugx', label: 'UGX - Ugandan Shilling' },
  { value: 'kes', label: 'KES - Kenyan Shilling' },
  { value: 'tzs', label: 'TZS - Tanzanian Shilling' },
  { value: 'eur', label: 'EUR - Euro' },
  { value: 'gbp', label: 'GBP - British Pound' },
];

const zeroDecimalCurrencies = new Set(['bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga', 'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf']);

function minorFactor(currency = 'usd') {
  return zeroDecimalCurrencies.has(String(currency).toLowerCase()) ? 1 : 100;
}

function formatAmount(amount, currency = 'usd') {
  const value = Number(amount || 0) / minorFactor(currency);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(value);
  } catch {
    return `${currency.toUpperCase()} ${value.toFixed(2)}`;
  }
}

function statusClass(status) {
  if (['paid', 'succeeded', 'complete'].includes(status)) return 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20';
  if (['checkout_created', 'open', 'processing', 'queued', 'mock_queued'].includes(status)) return 'text-amber-200 bg-amber-300/10 border-amber-200/20';
  if (['failed', 'canceled', 'cancelled'].includes(status)) return 'text-rose-300 bg-rose-400/10 border-rose-300/20';
  return 'text-slate-300 bg-white/8 border-white/10';
}

function providerIcon(id) {
  if (id === 'stripe') return <CreditCard size={18} />;
  if (id === 'mtn_momo' || id === 'airtel_money' || id === 'mpesa') return <Smartphone size={18} />;
  return <Banknote size={18} />;
}

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const checkoutStatus = params.get('status');

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('eicUser') || 'null'); }
    catch { return null; }
  }, []);

  const [amount, setAmount] = useState('99000');
  const [currency, setCurrency] = useState('ugx');
  const [description, setDescription] = useState('EIC Enterprise ERP subscription');
  const [customerPhone, setCustomerPhone] = useState('');
  const [methods, setMethods] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('stripe');
  const [mode, setMode] = useState('checking');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [recentPayments, setRecentPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const selectedMethod = methods.find(method => method.id === selectedProvider) || methods[0];
  const supportedCurrencies = selectedMethod?.currencies || currencies.map(c => c.value);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    loadMethods();
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedMethod && !supportedCurrencies.includes(currency)) {
      setCurrency(supportedCurrencies[0] || 'ugx');
    }
  }, [selectedProvider, methods]);

  async function loadMethods() {
    try {
      const res = await apiFetch('/api/payments/methods');
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error('Payment methods could not be loaded');
      setMethods(Array.isArray(data) ? data : []);
      const firstAvailable = data.find(method => method.available) || data[0];
      if (firstAvailable) {
        setSelectedProvider(firstAvailable.id);
        setMode(firstAvailable.mode || 'configured');
      }
    } catch (err) {
      setMode('unconfigured');
      setError(err.message || 'Payment configuration could not be loaded');
    }
  }

  async function loadHistory() {
    try {
      setLoadingHistory(true);
      const res = await apiFetch('/api/stripe/payment-intents?limit=8');
      if (res.ok) {
        const data = await res.json();
        setRecentPayments(Array.isArray(data) ? data : []);
      }
    } catch (_) {
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handlePayment(e) {
    e.preventDefault();
    setError('');
    setNotice('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid payment amount.');
      return;
    }
    if (!selectedMethod?.available) {
      setError(selectedMethod?.message || 'This payment method is not configured yet.');
      return;
    }

    try {
      setMode('initiating');
      const res = await apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify({
          provider: selectedProvider,
          amount: numericAmount,
          currency,
          description,
          customerPhone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to start payment');

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      setNotice(data.message || 'Payment request queued through the selected adapter.');
      await loadHistory();
      await loadMethods();
    } catch (err) {
      setError(err.message || 'Unable to start payment');
    } finally {
      setMode(selectedMethod?.mode || 'configured');
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#173235_0,#071011_34%,#050607_100%)] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#060809]/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <button onClick={() => navigate('/admin')} className="flex items-center gap-3 text-sm font-semibold text-slate-300 hover:text-white">
            <ArrowLeft size={18} />
            Dashboard
          </button>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100">
            <ShieldCheck size={14} />
            Provider state: {mode === 'initiating' ? 'initiating' : selectedMethod?.mode || mode}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {checkoutStatus === 'success' && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-emerald-100">
            <CheckCircle2 className="mt-0.5" size={20} />
            <div>
              <p className="font-bold">Payment completed</p>
              <p className="text-sm text-emerald-100/75">Stripe confirmed the checkout. Signed webhook reconciliation keeps the payment ledger current.</p>
            </div>
          </div>
        )}
        {checkoutStatus === 'cancelled' && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-amber-100">
            <XCircle className="mt-0.5" size={20} />
            <div>
              <p className="font-bold">Checkout cancelled</p>
              <p className="text-sm text-amber-100/75">No charge was completed. You can start a new payment request below.</p>
            </div>
          </div>
        )}

        <div className="mb-9">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-emerald-200/70">Adapter-ready payment operations</p>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Collect payments through secure server-side provider adapters.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Stripe remains the live Checkout path when configured. MTN MoMo, Airtel Money, M-Pesa, Flutterwave, and settlement adapters queue safely in mock mode until credentials are supplied.
          </p>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                {providerIcon(selectedProvider)}
              </div>
              <div>
                <h2 className="text-lg font-black">New client payment</h2>
                <p className="text-sm text-slate-400">Choose a provider adapter and create a tracked payment request.</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div>
            )}
            {notice && (
              <div className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
            )}

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {methods.map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedProvider(method.id)}
                  className={`rounded-2xl border p-4 text-left transition ${selectedProvider === method.id ? 'border-emerald-300/40 bg-emerald-300/10' : 'border-white/10 bg-black/20 hover:border-white/20'}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-black text-white">
                      {providerIcon(method.id)}
                      {method.label}
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${method.available ? 'border-emerald-300/20 text-emerald-100 bg-emerald-300/10' : 'border-rose-300/20 text-rose-100 bg-rose-400/10'}`}>
                      {method.mode}
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-slate-500">{method.description}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handlePayment} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Amount</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-lg font-bold text-white"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Currency</span>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm font-bold text-white">
                    {currencies.filter(c => supportedCurrencies.includes(c.value)).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Description</span>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-white"
                  placeholder="Invoice, subscription, implementation fee"
                />
              </label>

              {selectedProvider !== 'stripe' && (
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Phone or account reference</span>
                  <input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-white"
                    placeholder="+256 7XX XXX XXX or provider account"
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={mode === 'initiating' || !selectedMethod?.available}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mode === 'initiating' ? 'Starting payment...' : selectedProvider === 'stripe' ? 'Open Stripe Checkout' : 'Queue Provider Payment'}
                {selectedProvider === 'stripe' ? <ExternalLink size={17} /> : <RefreshCw size={17} />}
              </button>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['Server-only secrets', 'No bank credentials in frontend'],
                ['Provider webhooks', 'Recorded for reconciliation'],
                ['Centenary settlement', 'Configured server-side only'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <LockKeyhole size={16} className="mb-3 text-emerald-200" />
                  <p className="text-xs font-black text-white">{title}</p>
                  <p className="mt-1 text-xs text-slate-500">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-6 backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <ReceiptText size={19} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Payment ledger</h2>
                  <p className="text-sm text-slate-500">Latest Stripe and adapter records.</p>
                </div>
              </div>
              <button onClick={loadHistory} className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white">Refresh</button>
            </div>

            {loadingHistory ? (
              <div className="space-y-3">
                {[0, 1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 shimmer" />)}
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <p className="font-bold text-white">No payments recorded yet</p>
                <p className="mt-2 text-sm text-slate-500">Completed checkouts and queued adapter payments appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPayments.map(payment => (
                  <div key={payment.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{payment.description || 'EIC Enterprise payment'}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.provider || 'stripe'} / {payment.providerReference || payment.id}</p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-white">{formatAmount(payment.amount, payment.currency)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(payment.status)}`}>{payment.status}</span>
                      <span className="text-xs text-slate-600">{payment.created ? new Date(payment.created * 1000).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
