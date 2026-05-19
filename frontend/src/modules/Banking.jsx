import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const balanceHistory = [
  { date: 'Dec 1', centenary: 28.5, stanbic: 10.2, dfcu: 7.8 },
  { date: 'Dec 3', centenary: 30.1, stanbic: 10.5, dfcu: 7.9 },
  { date: 'Dec 5', centenary: 27.8, stanbic: 11.0, dfcu: 8.1 },
  { date: 'Dec 7', centenary: 31.2, stanbic: 11.4, dfcu: 8.2 },
  { date: 'Dec 9', centenary: 29.5, stanbic: 12.0, dfcu: 8.4 },
  { date: 'Dec 11', centenary: 33.8, stanbic: 12.4, dfcu: 8.6 },
  { date: 'Dec 13', centenary: 32.2, stanbic: 12.8, dfcu: 8.5 },
  { date: 'Dec 15', centenary: 35.4, stanbic: 13.1, dfcu: 8.7 },
];

const accounts = [
  { bank: 'Centenary Bank', type: 'Settlement Account', number: 'Configured server-side', balance: 'UGX 32,150,000', currency: 'UGX', status: 'Adapter-ready', branch: 'Server config' },
  { bank: 'Stanbic Bank', type: 'Operating Account', number: 'Configured server-side', balance: 'UGX 12,400,000', currency: 'UGX', status: 'Demo', branch: 'Server config' },
  { bank: 'DFCU Bank', type: 'Savings Account', number: 'Configured server-side', balance: 'UGX 8,600,000', currency: 'UGX', status: 'Demo', branch: 'Server config' },
];

const recentStatements = [
  { date: '2024-12-15', bank: 'Centenary', ref: 'STM-2024-12-15', entries: 42, format: 'PDF' },
  { date: '2024-12-01', bank: 'Centenary', ref: 'STM-2024-12-01', entries: 128, format: 'PDF' },
  { date: '2024-11-30', bank: 'Stanbic', ref: 'STM-2024-11-30', entries: 67, format: 'CSV' },
  { date: '2024-11-30', bank: 'DFCU', ref: 'STM-2024-11-30', entries: 23, format: 'PDF' },
  { date: '2024-11-01', bank: 'Centenary', ref: 'STM-2024-11-01', entries: 156, format: 'MT940' },
];

const reconciliation = [
  { account: 'Centenary Bank', bankBal: 'UGX 32,150,000', bookBal: 'UGX 32,150,000', diff: 'UGX 0', status: 'Reconciled' },
  { account: 'Stanbic Bank', bankBal: 'UGX 12,400,000', bookBal: 'UGX 12,180,000', diff: 'UGX 220,000', status: 'Pending' },
  { account: 'DFCU Bank', bankBal: 'UGX 8,600,000', bookBal: 'UGX 8,600,000', diff: 'UGX 0', status: 'Reconciled' },
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

export default function Banking() {
  const [tab, setTab] = useState('accounts');
  const [transferForm, setTransferForm] = useState({ from: 'centenary', to: 'stanbic', amount: '', note: '' });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Banking Integration</h1>
          <p className="text-neutral-500 text-sm mt-1">Banking and settlement adapters with server-only account credentials.</p>
        </div>
        <button className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
          + Fund Transfer
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {accounts.map((a, i) => (
          <div key={i} className="bg-[#141414] border border-white/6 rounded-2xl p-6 hover:border-white/14 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-white">{a.bank}</div>
                <div className="text-xs text-neutral-500">{a.type} · {a.branch}</div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-neutral-400 border border-white/10">{a.status}</span>
            </div>
            <div className="text-xs text-neutral-600 font-mono mb-1">{a.number}</div>
            <div className="text-2xl font-black text-white tracking-tight">{a.balance}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-1">Balance History</h3>
        <p className="text-xs text-neutral-600 mb-6">December 2024 — UGX millions</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={balanceHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="centenary" stroke="#ffffff" fill="rgba(255,255,255,0.06)" name="Centenary" />
            <Area type="monotone" dataKey="stanbic" stroke="#888888" fill="rgba(136,136,136,0.06)" name="Stanbic" />
            <Area type="monotone" dataKey="dfcu" stroke="#555555" fill="rgba(85,85,85,0.06)" name="DFCU" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {[
          { id: 'accounts', label: 'Transfer' },
          { id: 'statements', label: 'Statements' },
          { id: 'reconciliation', label: 'Reconciliation' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 max-w-xl">
          <h3 className="text-sm font-bold text-white mb-4">Fund Transfer</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">From Account</label>
                <select value={transferForm.from} onChange={e => setTransferForm({ ...transferForm, from: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm">
                  <option value="centenary">Centenary settlement adapter</option>
                  <option value="stanbic">Stanbic demo adapter</option>
                  <option value="dfcu">DFCU demo adapter</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">To Account</label>
                <select value={transferForm.to} onChange={e => setTransferForm({ ...transferForm, to: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm">
                  <option value="stanbic">Stanbic demo adapter</option>
                  <option value="centenary">Centenary settlement adapter</option>
                  <option value="dfcu">DFCU demo adapter</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Amount (UGX)</label>
              <input type="number" value={transferForm.amount} onChange={e => setTransferForm({ ...transferForm, amount: e.target.value })} placeholder="0" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Reference Note</label>
              <input value={transferForm.note} onChange={e => setTransferForm({ ...transferForm, note: e.target.value })} placeholder="Transfer reference..." className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            </div>
            <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-100 transition-all">
              Confirm Transfer →
            </button>
          </div>
        </div>
      )}

      {tab === 'statements' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4">Bank Statements</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Date</th>
              <th className="pb-3 text-left font-semibold">Bank</th>
              <th className="pb-3 text-left font-semibold">Reference</th>
              <th className="pb-3 text-right font-semibold">Entries</th>
              <th className="pb-3 text-left font-semibold">Format</th>
              <th className="pb-3 text-right font-semibold">Action</th>
            </tr></thead>
            <tbody>
              {recentStatements.map((s, i) => (
                <tr key={i} className="border-b border-white/4">
                  <td className="py-3 text-neutral-500 text-xs">{s.date}</td>
                  <td className="py-3 text-white font-medium">{s.bank}</td>
                  <td className="py-3 text-neutral-400 font-mono text-xs">{s.ref}</td>
                  <td className="py-3 text-right text-neutral-400">{s.entries}</td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/8 text-neutral-400">{s.format}</span></td>
                  <td className="py-3 text-right"><button className="text-xs text-white hover:underline">Download</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reconciliation' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4">Bank Reconciliation</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Account</th>
              <th className="pb-3 text-right font-semibold">Bank Balance</th>
              <th className="pb-3 text-right font-semibold">Book Balance</th>
              <th className="pb-3 text-right font-semibold">Difference</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {reconciliation.map((r, i) => (
                <tr key={i} className="border-b border-white/4">
                  <td className="py-3 text-white font-medium">{r.account}</td>
                  <td className="py-3 text-right text-neutral-300">{r.bankBal}</td>
                  <td className="py-3 text-right text-neutral-300">{r.bookBal}</td>
                  <td className="py-3 text-right font-bold text-white">{r.diff}</td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full ${r.status === 'Reconciled' ? 'bg-white/10 text-white' : 'bg-white/5 text-neutral-400'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex gap-3">
            <button className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full">Auto-Reconcile (AI)</button>
            <button className="text-sm text-neutral-500 border border-white/8 px-6 py-2.5 rounded-full hover:text-white">Manual Match</button>
          </div>
        </div>
      )}
    </div>
  );
}
