import React, { useState } from 'react';

const walletTxns = [
  { id: 'W-001', type: 'Received', from: '+256 770 123 456', amount: 'UGX 1,250,000', method: 'MTN MoMo', date: '2024-12-15 14:32', status: 'completed' },
  { id: 'W-002', type: 'Sent', from: '+256 701 987 654', amount: 'UGX 3,200,000', method: 'Bank Transfer', date: '2024-12-15 10:15', status: 'completed' },
  { id: 'W-003', type: 'Received', from: '+254 712 345 678', amount: 'KES 45,000', method: 'M-Pesa', date: '2024-12-14 16:45', status: 'completed' },
  { id: 'W-004', type: 'Sent', from: '+256 780 111 222', amount: 'UGX 850,000', method: 'Airtel Money', date: '2024-12-14 09:20', status: 'pending' },
  { id: 'W-005', type: 'Received', from: 'Invoice #INV-0042', amount: 'UGX 4,484,000', method: 'Stripe', date: '2024-12-13 11:30', status: 'completed' },
  { id: 'W-006', type: 'Disbursement', from: 'Payroll — 12 staff', amount: 'UGX 15,400,000', method: 'Centenary Bank', date: '2024-12-13 08:00', status: 'completed' },
];

const paymentMethods = [
  { id: 'mtn', name: 'MTN MoMo', desc: 'Mobile Money', icon: '📱', balance: 'UGX 2,340,000' },
  { id: 'airtel', name: 'Airtel Money', desc: 'Mobile Wallet', icon: '📲', balance: 'UGX 1,180,000' },
  { id: 'mpesa', name: 'M-Pesa', desc: 'Safaricom Daraja', icon: '💳', balance: 'KES 85,200' },
  { id: 'bank', name: 'Bank Transfer', desc: 'Centenary Bank', icon: '🏦', balance: 'UGX 32,150,000' },
];

export default function Wallet() {
  const [tab, setTab] = useState('overview');
  const [sendForm, setSendForm] = useState({ method: 'mtn', phone: '', amount: '', currency: 'UGX', note: '' });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Pi Wallet — Mobile Money</h1>
          <p className="text-neutral-500 text-sm mt-1">MTN MoMo, Airtel Money, M-Pesa, Bank Transfer — unified wallet.</p>
        </div>
        <button className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
          + Send Payment
        </button>
      </div>

      <div className="bg-[#141414] border border-white/6 rounded-2xl p-8 text-center">
        <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2">Total Wallet Balance</div>
        <div className="text-5xl font-black text-white tracking-tight mb-2">UGX 35,670,000</div>
        <div className="text-sm text-neutral-500">Approx USD 9,420 - settlement configured server-side only</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentMethods.map((m, i) => (
          <div key={i} className="bg-[#141414] border border-white/6 rounded-2xl p-5 hover:border-white/14 transition-all cursor-pointer">
            <div className="text-2xl mb-3">{m.icon}</div>
            <div className="text-sm font-bold text-white">{m.name}</div>
            <div className="text-xs text-neutral-500 mb-3">{m.desc}</div>
            <div className="text-sm font-black text-white">{m.balance}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {[
          { id: 'overview', label: 'Transactions' },
          { id: 'send', label: 'Send Money' },
          { id: 'request', label: 'Request Payment' },
          { id: 'bulk', label: 'Bulk Disbursement' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">ID</th>
              <th className="pb-3 text-left font-semibold">Type</th>
              <th className="pb-3 text-left font-semibold">From/To</th>
              <th className="pb-3 text-right font-semibold">Amount</th>
              <th className="pb-3 text-left font-semibold">Method</th>
              <th className="pb-3 text-left font-semibold">Date</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {walletTxns.map((t, i) => (
                <tr key={i} className="border-b border-white/4 hover:bg-white/[0.02]">
                  <td className="py-3 text-neutral-500 font-mono text-xs">{t.id}</td>
                  <td className="py-3"><span className={`text-xs font-bold ${t.type === 'Received' ? 'text-white' : t.type === 'Sent' ? 'text-neutral-400' : 'text-neutral-500'}`}>{t.type}</span></td>
                  <td className="py-3 text-white text-xs">{t.from}</td>
                  <td className="py-3 text-right text-white font-bold">{t.amount}</td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400">{t.method}</span></td>
                  <td className="py-3 text-neutral-500 text-xs">{t.date}</td>
                  <td className="py-3"><span className={`text-xs font-semibold ${t.status === 'completed' ? 'text-neutral-300' : 'text-neutral-500'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'send' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 max-w-xl">
          <h3 className="text-sm font-bold text-white mb-4">Send Payment</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map(m => (
                  <button key={m.id} onClick={() => setSendForm({ ...sendForm, method: m.id })} className={`text-left p-3 rounded-xl border transition-all ${sendForm.method === m.id ? 'border-white/30 bg-white/5' : 'border-white/6 hover:border-white/14'}`}>
                    <div className="text-sm font-bold text-white">{m.icon} {m.name}</div>
                    <div className="text-xs text-neutral-500">{m.balance}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Recipient Phone / Account</label>
              <input value={sendForm.phone} onChange={e => setSendForm({ ...sendForm, phone: e.target.value })} placeholder="+256 7XX XXX XXX" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Amount</label>
                <input type="number" value={sendForm.amount} onChange={e => setSendForm({ ...sendForm, amount: e.target.value })} placeholder="0" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Currency</label>
                <select value={sendForm.currency} onChange={e => setSendForm({ ...sendForm, currency: e.target.value })} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm">
                  <option value="UGX">UGX</option><option value="KES">KES</option><option value="TZS">TZS</option><option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Note (Optional)</label>
              <input value={sendForm.note} onChange={e => setSendForm({ ...sendForm, note: e.target.value })} placeholder="Payment for..." className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            </div>
            <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-100 transition-all">
              Send Payment →
            </button>
          </div>
        </div>
      )}

      {tab === 'request' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 max-w-xl">
          <h3 className="text-sm font-bold text-white mb-4">Create Payment Request Link</h3>
          <div className="space-y-4">
            <input placeholder="Amount (UGX)" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            <input placeholder="Description" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            <select className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm">
              <option>Accept: All methods</option>
              <option>MTN MoMo only</option>
              <option>Bank Transfer only</option>
              <option>M-Pesa only</option>
            </select>
            <button className="w-full bg-white text-black font-bold py-3 rounded-xl">Generate Link →</button>
            <div className="bg-[#0a0a0a] border border-white/6 rounded-xl p-4">
              <div className="text-xs text-neutral-500 mb-2">Share via:</div>
              <div className="flex gap-3">
                <button className="text-xs bg-white/5 text-neutral-300 border border-white/10 px-4 py-2 rounded-full font-bold">WhatsApp</button>
                <button className="text-xs bg-white/5 text-neutral-400 border border-white/10 px-4 py-2 rounded-full font-bold">SMS</button>
                <button className="text-xs bg-white/5 text-neutral-400 border border-white/10 px-4 py-2 rounded-full font-bold">Email</button>
                <button className="text-xs bg-white/5 text-neutral-400 border border-white/10 px-4 py-2 rounded-full font-bold">Copy Link</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'bulk' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Bulk Payment Disbursement</h3>
          <p className="text-xs text-neutral-500 mb-4">Upload CSV or manually add recipients for payroll, supplier payments.</p>
          <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center mb-4">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm text-neutral-400 mb-1">Drop CSV file here or click to upload</div>
            <div className="text-xs text-neutral-600">Format: Name, Phone/Account, Amount, Method</div>
          </div>
          <div className="flex gap-3">
            <button className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full">Upload & Process</button>
            <button className="text-sm text-neutral-500 border border-white/8 px-6 py-2.5 rounded-full hover:text-white">Download Template</button>
          </div>
        </div>
      )}
    </div>
  );
}
