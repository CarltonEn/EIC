import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const filings = [
  { type: 'VAT Return', period: 'Nov 2024', amount: 'UGX 2,180,000', status: 'Filed', date: '2024-12-10', ref: 'URA-VAT-2024-11' },
  { type: 'PAYE', period: 'Nov 2024', amount: 'UGX 1,540,000', status: 'Filed', date: '2024-12-08', ref: 'URA-PAYE-2024-11' },
  { type: 'WHT', period: 'Nov 2024', amount: 'UGX 680,000', status: 'Filed', date: '2024-12-05', ref: 'URA-WHT-2024-11' },
  { type: 'VAT Return', period: 'Dec 2024', amount: 'UGX 2,450,000', status: 'Pending', date: '-', ref: '-' },
  { type: 'Income Tax', period: 'Q4 2024', amount: 'UGX 4,800,000', status: 'Draft', date: '-', ref: '-' },
  { type: 'Excise Duty', period: 'Nov 2024', amount: 'UGX 320,000', status: 'Filed', date: '2024-12-07', ref: 'URA-EXC-2024-11' },
];

const seedInvoices = [
  { number: 'EFRIS-001284', client: 'Kampala Tech Ltd', amount: 'UGX 3,800,000', vat: 'UGX 684,000', total: 'UGX 4,484,000', status: 'Validated', reference: 'URA-001284', qr: true },
  { number: 'EFRIS-001283', client: 'Safari Solutions', amount: 'UGX 7,200,000', vat: 'UGX 1,296,000', total: 'UGX 8,496,000', status: 'Validated', reference: 'URA-001283', qr: true },
  { number: 'EFRIS-001282', client: 'Nile Logistics', amount: 'UGX 12,500,000', vat: 'UGX 2,250,000', total: 'UGX 14,750,000', status: 'Queued', reference: '-', qr: false },
  { number: 'EFRIS-001281', client: 'Mango Digital', amount: 'UGX 2,100,000', vat: 'UGX 378,000', total: 'UGX 2,478,000', status: 'Validated', reference: 'URA-001281', qr: true },
];

const deadlines = [
  { tax: 'VAT Return', deadline: 'Dec 15, 2024', status: 'Due in 3 days', urgent: true },
  { tax: 'PAYE', deadline: 'Jan 15, 2025', status: 'Due in 34 days', urgent: false },
  { tax: 'WHT', deadline: 'Jan 15, 2025', status: 'Due in 34 days', urgent: false },
  { tax: 'Income Tax (Q4)', deadline: 'Jan 31, 2025', status: 'Due in 50 days', urgent: false },
  { tax: 'Excise Duty', deadline: 'Dec 20, 2024', status: 'Due in 8 days', urgent: true },
];

const countries = [
  { code: 'UG', name: 'Uganda', system: 'URA EFRIS', status: 'Adapter-ready', compliance: 'Server-side' },
  { code: 'KE', name: 'Kenya', system: 'KRA iTax', status: 'Planned adapter', compliance: '-' },
  { code: 'TZ', name: 'Tanzania', system: 'TRA', status: 'Planned adapter', compliance: '-' },
  { code: 'RW', name: 'Rwanda', system: 'RRA', status: 'Planned adapter', compliance: '-' },
  { code: 'NG', name: 'Nigeria', system: 'FIRS', status: 'Planned adapter', compliance: '-' },
  { code: 'UK', name: 'United Kingdom', system: 'HMRC MTD', status: 'Available for roadmap', compliance: '-' },
];

function money(value, currency = 'UGX') {
  return `${currency} ${Number(value || 0).toLocaleString()}`;
}

function mapInvoice(row) {
  return {
    id: row.id,
    number: row.invoice_number,
    client: row.client_name,
    amount: money(row.amount, row.currency || 'UGX'),
    vat: money(row.vat_amount, row.currency || 'UGX'),
    total: money(row.total_amount, row.currency || 'UGX'),
    status: row.efris_provider_status || row.efris_status || row.status || 'draft',
    reference: row.efris_reference || '-',
    qr: Boolean(row.efris_qr),
    lastSync: row.efris_last_sync_at,
  };
}

function statusPill(status) {
  if (['validated', 'submitted', 'filed'].includes(String(status).toLowerCase())) return 'bg-emerald-300/10 text-emerald-100 border border-emerald-300/20';
  if (['queued', 'pending', 'mock_queued'].includes(String(status).toLowerCase())) return 'bg-amber-300/10 text-amber-100 border border-amber-300/20';
  return 'bg-white/5 text-neutral-400 border border-white/10';
}

export default function EFRIS() {
  const [tab, setTab] = useState('overview');
  const [tinLookup, setTinLookup] = useState('');
  const [invoiceRows, setInvoiceRows] = useState(seedInvoices);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [syncingId, setSyncingId] = useState('');
  const [efrisProvider, setEfrisProvider] = useState(null);
  const [notice, setNotice] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'filings', label: 'Tax Filings' },
    { id: 'invoices', label: 'e-Invoices' },
    { id: 'countries', label: 'Multi-Country' },
  ];

  useEffect(() => {
    apiFetch('/api/integrations/status')
      .then(res => res.json())
      .then(data => setEfrisProvider(data.providers?.find(provider => provider.id === 'ura_efris') || null))
      .catch(() => setEfrisProvider(null));

    apiFetch('/api/invoices')
      .then(res => res.ok ? res.json() : [])
      .then(rows => {
        if (Array.isArray(rows) && rows.length > 0) {
          setInvoiceRows([...rows.map(mapInvoice), ...seedInvoices]);
        }
      })
      .catch(() => {});
  }, []);

  const syncInvoice = async (invoiceId) => {
    if (!invoiceId) return;
    setSyncingId(invoiceId);
    setNotice('');
    try {
      const res = await apiFetch(`/api/invoices/${invoiceId}/efris-submit`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'EFRIS sync failed');
      const mapped = mapInvoice(data.invoice);
      setInvoiceRows(prev => prev.map(row => row.id === invoiceId ? mapped : row));
      setNotice(data.message || 'Invoice synced with the EFRIS adapter.');
    } catch (err) {
      setNotice(err.message || 'EFRIS sync failed');
    } finally {
      setSyncingId('');
      setTab('invoices');
    }
  };

  const createEfrisInvoice = async () => {
    setCreatingInvoice(true);
    setNotice('');
    try {
      const res = await apiFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          client_name: 'Launch Client Ltd',
          client_email: 'finance@launchclient.com',
          amount: 3800000,
          currency: 'UGX',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invoice creation failed');
      const mapped = mapInvoice(data);
      setInvoiceRows(prev => [mapped, ...prev]);
      setTab('invoices');
      await syncInvoice(data.id);
    } catch (err) {
      setNotice(err.message || 'Invoice creation failed');
    } finally {
      setCreatingInvoice(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">EFRIS / Tax Compliance</h1>
          <p className="text-neutral-500 text-sm mt-1">Local VAT records plus a server-side URA EFRIS adapter. Mock queueing is used until credentials are configured.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${efrisProvider?.configured ? 'bg-emerald-300/10 text-emerald-100 border border-emerald-300/20' : 'bg-amber-300/10 text-amber-100 border border-amber-300/20'}`}>
            URA EFRIS: {efrisProvider?.mode || 'checking'}
          </span>
          <button onClick={createEfrisInvoice} disabled={creatingInvoice || Boolean(syncingId)} className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all disabled:opacity-50">
            {creatingInvoice ? 'Creating...' : 'Create and sync invoice'}
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-neutral-200">{notice}</div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'VAT Due', value: 'UGX 2.45M', sub: 'December 2024' },
          { label: 'Total Tax Filed', value: 'UGX 4.4M', sub: 'Nov 2024' },
          { label: 'EFRIS Queue', value: invoiceRows.filter(row => String(row.status).toLowerCase().includes('queued')).length, sub: 'Pending adapter sync' },
          { label: 'URA Adapter', value: efrisProvider?.configured ? 'Configured' : 'Mock', sub: 'Server-side only' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">{s.label}</div>
            <div className="text-2xl font-black tracking-tight text-white">{s.value}</div>
            <div className="text-xs text-neutral-600 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">URA Tax Calendar</h3>
            <div className="space-y-3">
              {deadlines.map((d, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/4 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-white">{d.tax}</div>
                    <div className="text-xs text-neutral-500">{d.deadline}</div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${d.urgent ? 'bg-white/10 text-white border border-white/20' : 'bg-white/5 text-neutral-400 border border-white/8'}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4">TIN Validation & Lookup</h3>
            <div className="flex gap-3 mb-6">
              <input value={tinLookup} onChange={e => setTinLookup(e.target.value)} placeholder="Enter TIN number" className="flex-1 bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
              <button className="bg-white text-black text-sm font-bold px-6 py-3 rounded-xl">Validate</button>
            </div>
            <div className="bg-[#0a0a0a] border border-white/6 rounded-xl p-4">
              <div className="text-xs text-neutral-600 mb-3">Adapter status</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-neutral-400">URA credentials</span><span className="text-white font-bold">{efrisProvider?.configured ? 'Configured' : 'Missing'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-400">Fallback mode</span><span className="text-white font-bold">{efrisProvider?.mode || 'checking'}</span></div>
                <div className="flex justify-between text-sm border-t border-white/6 pt-2 mt-2"><span className="text-neutral-400">Frontend exposure</span><span className="text-white font-black">No secrets</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'filings' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Tax Type</th>
              <th className="pb-3 text-left font-semibold">Period</th>
              <th className="pb-3 text-right font-semibold">Amount</th>
              <th className="pb-3 text-left font-semibold">Status</th>
              <th className="pb-3 text-left font-semibold">Filed Date</th>
              <th className="pb-3 text-left font-semibold">Reference</th>
            </tr></thead>
            <tbody>
              {filings.map((f, i) => (
                <tr key={i} className="border-b border-white/4">
                  <td className="py-3 text-white font-medium">{f.type}</td>
                  <td className="py-3 text-neutral-400">{f.period}</td>
                  <td className="py-3 text-right text-white font-bold">{f.amount}</td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full border ${statusPill(f.status)}`}>{f.status}</span></td>
                  <td className="py-3 text-neutral-500 text-xs">{f.date}</td>
                  <td className="py-3 text-neutral-500 font-mono text-xs">{f.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4">EFRIS e-Invoices and Adapter Sync</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Invoice #</th>
              <th className="pb-3 text-left font-semibold">Client</th>
              <th className="pb-3 text-right font-semibold">Amount</th>
              <th className="pb-3 text-right font-semibold">VAT (18%)</th>
              <th className="pb-3 text-right font-semibold">Total</th>
              <th className="pb-3 text-left font-semibold">Reference</th>
              <th className="pb-3 text-left font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">Action</th>
            </tr></thead>
            <tbody>
              {invoiceRows.map((inv, i) => (
                <tr key={`${inv.number}-${i}`} className="border-b border-white/4">
                  <td className="py-3 text-neutral-400 font-mono text-xs">{inv.number}</td>
                  <td className="py-3 text-white font-medium">{inv.client}</td>
                  <td className="py-3 text-right text-neutral-300">{inv.amount}</td>
                  <td className="py-3 text-right text-neutral-400">{inv.vat}</td>
                  <td className="py-3 text-right text-white font-bold">{inv.total}</td>
                  <td className="py-3 text-neutral-500 font-mono text-xs">{inv.reference}</td>
                  <td className="py-3"><span className={`text-xs px-2 py-1 rounded-full ${statusPill(inv.status)}`}>{inv.status}</span></td>
                  <td className="py-3 text-right">
                    {inv.id ? (
                      <button onClick={() => syncInvoice(inv.id)} disabled={syncingId === inv.id} className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-neutral-300 hover:text-white disabled:opacity-50">
                        {syncingId === inv.id ? 'Syncing...' : 'Sync'}
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-700">Seed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'countries' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Multi-Country Tax Integrations</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {countries.map((c, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/6 rounded-2xl p-5 hover:border-white/14 transition-all">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-black text-white">{c.code}</div>
                <div className="text-sm font-bold text-white mb-1">{c.name}</div>
                <div className="text-xs text-neutral-500 mb-3">{c.system}</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-neutral-400 border border-white/10">{c.status}</span>
                  {c.compliance !== '-' && <span className="text-xs font-bold text-white">{c.compliance}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
