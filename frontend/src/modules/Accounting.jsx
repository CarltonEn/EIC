import React, { useState } from 'react';
import { apiFetch } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const plData = [
  { category: 'Services', income: 28.5, expenses: 12.3 },
  { category: 'Products', income: 15.2, expenses: 9.8 },
  { category: 'Consulting', income: 8.7, expenses: 3.2 },
  { category: 'Licensing', income: 4.1, expenses: 1.1 },
  { category: 'Other', income: 2.3, expenses: 1.8 },
];

const ledgerEntries = [
  { date: '2024-12-15', ref: 'JE-1042', account: '4000 - Revenue', description: 'Subscription income — Dec', debit: '', credit: 'UGX 3,800,000', balance: 'UGX 48,200,000' },
  { date: '2024-12-15', ref: 'JE-1042', account: '1100 - Centenary Bank', description: 'Bank deposit — subscription', debit: 'UGX 3,800,000', credit: '', balance: 'UGX 32,150,000' },
  { date: '2024-12-14', ref: 'JE-1041', account: '5100 - Salaries', description: 'Payroll — December', debit: 'UGX 15,400,000', credit: '', balance: 'UGX 15,400,000' },
  { date: '2024-12-14', ref: 'JE-1041', account: '1100 - Centenary Bank', description: 'Payroll disbursement', debit: '', credit: 'UGX 15,400,000', balance: 'UGX 16,750,000' },
  { date: '2024-12-13', ref: 'JE-1040', account: '2100 - Accounts Payable', description: 'Supplier — TechCo Ltd', debit: 'UGX 2,100,000', credit: '', balance: 'UGX 4,300,000' },
  { date: '2024-12-12', ref: 'JE-1039', account: '4200 - Consulting Revenue', description: 'Consulting fee — Project Alpha', debit: '', credit: 'UGX 5,200,000', balance: 'UGX 5,200,000' },
  { date: '2024-12-11', ref: 'JE-1038', account: '5200 - Office Supplies', description: 'Stationery purchase', debit: 'UGX 450,000', credit: '', balance: 'UGX 1,250,000' },
  { date: '2024-12-10', ref: 'JE-1037', account: '1200 - Stanbic Bank', description: 'Client payment received', debit: 'UGX 7,800,000', credit: '', balance: 'UGX 12,400,000' },
];

const arEntries = [
  { client: 'Kampala Tech Ltd', invoice: 'INV-0042', amount: 'UGX 3,800,000', due: '2024-12-30', aging: 'Current', status: 'Outstanding' },
  { client: 'Safari Solutions', invoice: 'INV-0038', amount: 'UGX 7,200,000', due: '2024-12-15', aging: '0-30 days', status: 'Outstanding' },
  { client: 'Nile Logistics', invoice: 'INV-0035', amount: 'UGX 12,500,000', due: '2024-11-30', aging: '31-60 days', status: 'Overdue' },
  { client: 'Mango Digital', invoice: 'INV-0031', amount: 'UGX 2,100,000', due: '2024-11-15', aging: '61-90 days', status: 'Overdue' },
];

const chartAccounts = [
  { code: '1000', name: 'Assets', type: 'Asset', balance: 'UGX 85,200,000' },
  { code: '1100', name: 'Centenary Bank', type: 'Asset', balance: 'UGX 32,150,000' },
  { code: '1200', name: 'Stanbic Bank', type: 'Asset', balance: 'UGX 12,400,000' },
  { code: '1300', name: 'DFCU Savings', type: 'Asset', balance: 'UGX 8,600,000' },
  { code: '2000', name: 'Liabilities', type: 'Liability', balance: 'UGX 18,400,000' },
  { code: '2100', name: 'Accounts Payable', type: 'Liability', balance: 'UGX 4,300,000' },
  { code: '3000', name: 'Equity', type: 'Equity', balance: 'UGX 42,800,000' },
  { code: '4000', name: 'Revenue', type: 'Revenue', balance: 'UGX 48,200,000' },
  { code: '5000', name: 'Expenses', type: 'Expense', balance: 'UGX 26,800,000' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs font-bold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-neutral-400">
          <span style={{ color: p.color }}>{p.name}</span>: UGX {p.value}M
        </p>
      ))}
    </div>
  );
};

export default function Accounting() {
  const [tab, setTab] = useState('ledger');
  const [showJournal, setShowJournal] = useState(false);
  const [journalForm, setJournalForm] = useState({ account: '', description: '', debit: '', credit: '', bank: 'centenary' });
  const [entries, setEntries] = useState(ledgerEntries);
  const [posting, setPosting] = useState(false);
  const [journalError, setJournalError] = useState('');

  const tabs = [
    { id: 'ledger', label: 'General Ledger' },
    { id: 'pl', label: 'P&L Statement' },
    { id: 'ar', label: 'Receivables' },
    { id: 'coa', label: 'Chart of Accounts' },
  ];

  const handlePostJournal = async () => {
    const account = chartAccounts.find(a => a.code === journalForm.account);
    if (!account || !journalForm.description || (!journalForm.debit && !journalForm.credit)) {
      setJournalError('Select an account, add a description, and enter a debit or credit.');
      return;
    }
    setPosting(true);
    setJournalError('');
    try {
      const res = await apiFetch('/api/journal-entries', {
        method: 'POST',
        body: JSON.stringify({
          account_code: account.code,
          account_name: account.name,
          description: journalForm.description,
          debit: Number(journalForm.debit) || 0,
          credit: Number(journalForm.credit) || 0,
          bank: journalForm.bank,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Journal posting failed');
      const amount = Number(journalForm.debit || journalForm.credit || 0).toLocaleString();
      setEntries(prev => [{
        date: new Date().toISOString().slice(0, 10),
        ref: data.reference || 'JE-NEW',
        account: `${account.code} - ${account.name}`,
        description: journalForm.description,
        debit: journalForm.debit ? `UGX ${amount}` : '',
        credit: journalForm.credit ? `UGX ${amount}` : '',
        balance: 'Posted',
      }, ...prev]);
      setJournalForm({ account: '', description: '', debit: '', credit: '', bank: 'centenary' });
      setShowJournal(false);
    } catch (err) {
      setJournalError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">ERP Accounting</h1>
          <p className="text-neutral-500 text-sm mt-1">Double-entry ledger, P&L, receivables — IFRS compliant.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowJournal(!showJournal)} className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
            + Journal Entry
          </button>
          <select className="bg-[#141414] border border-white/8 rounded-full px-4 py-2 text-xs text-neutral-400">
            <option>Export PDF</option>
            <option>Export CSV</option>
            <option>Export Excel</option>
            <option>Export XBRL</option>
          </select>
        </div>
      </div>

      {showJournal && (
        <div className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">New Journal Entry</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <select value={journalForm.account} onChange={e => setJournalForm({ ...journalForm, account: e.target.value })} className="bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm">
              <option value="">Select Account</option>
              {chartAccounts.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
            </select>
            <input placeholder="Description" value={journalForm.description} onChange={e => setJournalForm({ ...journalForm, description: e.target.value })} className="bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            <input placeholder="Debit (UGX)" type="number" value={journalForm.debit} onChange={e => setJournalForm({ ...journalForm, debit: e.target.value })} className="bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            <input placeholder="Credit (UGX)" type="number" value={journalForm.credit} onChange={e => setJournalForm({ ...journalForm, credit: e.target.value })} className="bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            <select value={journalForm.bank} onChange={e => setJournalForm({ ...journalForm, bank: e.target.value })} className="bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm">
              <option value="centenary">Centenary Bank</option>
              <option value="stanbic">Stanbic Bank</option>
              <option value="dfcu">DFCU</option>
              <option value="pi_wallet">Pi Wallet</option>
            </select>
          </div>
          {journalError && <p className="mt-3 text-xs text-red-400">{journalError}</p>}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={handlePostJournal} disabled={posting} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-50">{posting ? 'Posting...' : 'Post Entry'}</button>
            <button onClick={() => setShowJournal(false)} className="text-sm text-neutral-500 hover:text-white px-4 py-2.5">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ledger' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Date</th>
              <th className="pb-3 text-left font-semibold">Ref</th>
              <th className="pb-3 text-left font-semibold">Account</th>
              <th className="pb-3 text-left font-semibold">Description</th>
              <th className="pb-3 text-right font-semibold">Debit</th>
              <th className="pb-3 text-right font-semibold">Credit</th>
              <th className="pb-3 text-right font-semibold">Balance</th>
            </tr></thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-white/4 hover:bg-white/[0.02]">
                  <td className="py-3 text-neutral-500 text-xs">{e.date}</td>
                  <td className="py-3 text-neutral-500 font-mono text-xs">{e.ref}</td>
                  <td className="py-3 text-white font-medium text-xs">{e.account}</td>
                  <td className="py-3 text-neutral-300 text-xs">{e.description}</td>
                  <td className="py-3 text-right text-white font-mono text-xs">{e.debit || '—'}</td>
                  <td className="py-3 text-right text-white font-mono text-xs">{e.credit || '—'}</td>
                  <td className="py-3 text-right text-white font-bold text-xs">{e.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pl' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-1">Profit & Loss Statement</h3>
          <p className="text-xs text-neutral-600 mb-6">Income vs Expenses by category — UGX millions</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={plData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="rgba(255,255,255,0.06)" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/6">
            <div><div className="text-xs text-neutral-500">Total Income</div><div className="text-lg font-black text-white">UGX 58.8M</div></div>
            <div><div className="text-xs text-neutral-500">Total Expenses</div><div className="text-lg font-black text-white">UGX 28.2M</div></div>
            <div><div className="text-xs text-neutral-500">Net Profit</div><div className="text-lg font-black text-white">UGX 30.6M</div></div>
          </div>
        </div>
      )}

      {tab === 'ar' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4">Accounts Receivable — Aging Report</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Client</th>
              <th className="pb-3 text-left font-semibold">Invoice</th>
              <th className="pb-3 text-right font-semibold">Amount</th>
              <th className="pb-3 text-left font-semibold">Due Date</th>
              <th className="pb-3 text-left font-semibold">Aging</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {arEntries.map((e, i) => (
                <tr key={i} className="border-b border-white/4">
                  <td className="py-3 text-white font-medium">{e.client}</td>
                  <td className="py-3 text-neutral-400 font-mono text-xs">{e.invoice}</td>
                  <td className="py-3 text-right text-white font-bold">{e.amount}</td>
                  <td className="py-3 text-neutral-500 text-xs">{e.due}</td>
                  <td className="py-3"><span className={`text-xs px-2 py-1 rounded-full ${e.aging === 'Current' ? 'bg-white/10 text-white' : e.aging === '0-30 days' ? 'bg-white/5 text-neutral-300' : 'bg-white/5 text-neutral-500'}`}>{e.aging}</span></td>
                  <td className="py-3"><span className="text-xs font-semibold text-neutral-400">{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-white/6 flex gap-6">
            <div><span className="text-xs text-neutral-500">Total Outstanding:</span> <span className="text-sm font-bold text-white">UGX 25,600,000</span></div>
            <div><span className="text-xs text-neutral-500">Overdue:</span> <span className="text-sm font-bold text-neutral-300">UGX 14,600,000</span></div>
          </div>
        </div>
      )}

      {tab === 'coa' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4">Chart of Accounts</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Code</th>
              <th className="pb-3 text-left font-semibold">Account Name</th>
              <th className="pb-3 text-left font-semibold">Type</th>
              <th className="pb-3 text-right font-semibold">Balance</th>
            </tr></thead>
            <tbody>
              {chartAccounts.map((a, i) => (
                <tr key={i} className={`border-b border-white/4 ${a.code.endsWith('000') ? 'bg-white/[0.02]' : ''}`}>
                  <td className="py-3 text-neutral-400 font-mono text-xs">{a.code}</td>
                  <td className={`py-3 font-medium ${a.code.endsWith('000') ? 'text-white font-bold' : 'text-neutral-300 pl-4'}`}>{a.name}</td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/8 text-neutral-400">{a.type}</span></td>
                  <td className="py-3 text-right text-white font-bold text-xs">{a.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
