import React, { useState, useEffect } from 'react';

const cryptoAssets = [
  { symbol: 'BTC', name: 'Bitcoin', price: 43250.00, change: 2.4, held: 0.125, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 2280.00, change: -1.2, held: 1.85, icon: 'Ξ' },
  { symbol: 'USDT', name: 'Tether', price: 1.00, change: 0.01, held: 5000, icon: '₮' },
  { symbol: 'SOL', name: 'Solana', price: 98.50, change: 5.8, held: 12.5, icon: '◎' },
  { symbol: 'BNB', name: 'BNB', price: 312.40, change: -0.8, held: 3.2, icon: '◆' },
  { symbol: 'USDC', name: 'USD Coin', price: 1.00, change: 0.00, held: 3200, icon: '$' },
  { symbol: 'PI', name: 'Pi Network', price: 42.50, change: 12.3, held: 850, icon: 'π' },
];

const ugxRate = 3780;

const cryptoTxns = [
  { id: 'CRY-001', type: 'Received', asset: 'BTC', amount: '0.025 BTC', value: 'UGX 3,582,000', from: 'Invoice #INV-0045', date: '2024-12-15', status: 'confirmed' },
  { id: 'CRY-002', type: 'Sent', asset: 'USDT', amount: '500 USDT', value: 'UGX 1,890,000', from: 'Supplier Payment', date: '2024-12-14', status: 'confirmed' },
  { id: 'CRY-003', type: 'Received', asset: 'PI', amount: '200 PI', value: 'UGX 32,130,000', from: 'Subscription (20% off)', date: '2024-12-13', status: 'confirmed' },
  { id: 'CRY-004', type: 'Swap', asset: 'ETH→USDT', amount: '0.5 ETH', value: 'UGX 4,309,200', from: 'Internal swap', date: '2024-12-12', status: 'confirmed' },
  { id: 'CRY-005', type: 'Received', asset: 'SOL', amount: '5 SOL', value: 'UGX 1,861,650', from: 'Client Payment', date: '2024-12-11', status: 'pending' },
];

export default function Crypto() {
  const [tab, setTab] = useState('rates');
  const [piDiscount, setPiDiscount] = useState(true);

  const totalPortfolio = cryptoAssets.reduce((sum, a) => sum + (a.price * a.held), 0);
  const totalUGX = totalPortfolio * ugxRate;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Crypto & Pi Network</h1>
          <p className="text-neutral-500 text-sm mt-1">Multi-crypto wallet, Pi Coin acceptance, real-time rates.</p>
        </div>
        <button className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
          + Generate Payment Link
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Portfolio Value', value: `$${totalPortfolio.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
          { label: 'UGX Equivalent', value: `UGX ${(totalUGX / 1000000).toFixed(1)}M` },
          { label: 'Pi Holdings', value: `${cryptoAssets.find(a => a.symbol === 'PI').held} PI` },
          { label: 'Pi Discount', value: '20% OFF' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">{s.label}</div>
            <div className={`text-2xl font-black tracking-tight ${s.color || 'text-white'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Pi Network — First-Class Payment</h3>
            <p className="text-xs text-neutral-500 mt-1">Accept Pi Coin with 20% subscription discount for your customers.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500">Pi Discount Active</span>
            <button onClick={() => setPiDiscount(!piDiscount)} className={`w-12 h-6 rounded-full transition-all ${piDiscount ? 'bg-white' : 'bg-white/10'}`}>
              <div className={`w-5 h-5 rounded-full transition-all ${piDiscount ? 'bg-black translate-x-6' : 'bg-neutral-500 translate-x-0.5'}`} />
            </button>
          </div>
        </div>
        <div className="bg-[#0a0a0a] border border-white/6 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-black text-white mb-1">π</div>
              <div className="text-xs text-neutral-500">Pi Coin</div>
              <div className="text-sm font-bold text-white">${cryptoAssets.find(a => a.symbol === 'PI').price}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">Standard Price</div>
              <div className="text-sm text-neutral-400 line-through">$99/mo</div>
              <div className="text-xs text-neutral-600 mt-1">Regular subscription</div>
            </div>
            <div>
              <div className="text-xs text-neutral-500 mb-1">With Pi Coin</div>
              <div className="text-sm font-bold text-white">$79.20/mo</div>
              <div className="text-xs text-neutral-500 mt-1">Save 20%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {[
          { id: 'rates', label: 'Live Rates' },
          { id: 'transactions', label: 'Transactions' },
          { id: 'payment', label: 'Accept Crypto' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rates' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Asset</th>
              <th className="pb-3 text-right font-semibold">Price (USD)</th>
              <th className="pb-3 text-right font-semibold">24h Change</th>
              <th className="pb-3 text-right font-semibold">UGX Rate</th>
              <th className="pb-3 text-right font-semibold">Holdings</th>
              <th className="pb-3 text-right font-semibold">Value (USD)</th>
            </tr></thead>
            <tbody>
              {cryptoAssets.map((a, i) => (
                <tr key={i} className="border-b border-white/4 hover:bg-white/[0.02]">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{a.icon}</span>
                      <div>
                        <div className="text-white font-bold">{a.symbol}</div>
                        <div className="text-xs text-neutral-500">{a.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right text-white font-bold">${a.price.toLocaleString()}</td>
                  <td className={`py-3 text-right font-bold ${a.change >= 0 ? 'text-white' : 'text-neutral-500'}`}>{a.change >= 0 ? '+' : ''}{a.change}%</td>
                  <td className="py-3 text-right text-neutral-400">UGX {(a.price * ugxRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="py-3 text-right text-neutral-300">{a.held} {a.symbol}</td>
                  <td className="py-3 text-right text-white font-bold">${(a.price * a.held).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">ID</th>
              <th className="pb-3 text-left font-semibold">Type</th>
              <th className="pb-3 text-left font-semibold">Asset</th>
              <th className="pb-3 text-right font-semibold">Amount</th>
              <th className="pb-3 text-right font-semibold">UGX Value</th>
              <th className="pb-3 text-left font-semibold">Description</th>
              <th className="pb-3 text-left font-semibold">Date</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {cryptoTxns.map((t, i) => (
                <tr key={i} className="border-b border-white/4">
                  <td className="py-3 text-neutral-500 font-mono text-xs">{t.id}</td>
                  <td className="py-3"><span className={`text-xs font-bold ${t.type === 'Received' ? 'text-white' : t.type === 'Sent' ? 'text-neutral-400' : 'text-neutral-500'}`}>{t.type}</span></td>
                  <td className="py-3 text-white font-medium">{t.asset}</td>
                  <td className="py-3 text-right text-neutral-300">{t.amount}</td>
                  <td className="py-3 text-right text-white font-bold">{t.value}</td>
                  <td className="py-3 text-neutral-400 text-xs">{t.from}</td>
                  <td className="py-3 text-neutral-500 text-xs">{t.date}</td>
                  <td className="py-3"><span className={`text-xs font-semibold ${t.status === 'confirmed' ? 'text-neutral-300' : 'text-neutral-500'}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payment' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 max-w-xl">
          <h3 className="text-sm font-bold text-white mb-4">Generate Crypto Payment Link</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Invoice / Description</label>
              <input placeholder="Invoice #INV-0046" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Amount (USD)</label>
                <input type="number" placeholder="0.00" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-2 block">Accept Currencies</label>
                <select className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm">
                  <option>All Crypto</option>
                  <option>BTC only</option>
                  <option>ETH + USDT</option>
                  <option>Pi Coin only</option>
                  <option>Stablecoins only</option>
                </select>
              </div>
            </div>
            <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-neutral-100 transition-all">
              Generate Payment Link →
            </button>
            <p className="text-xs text-neutral-600 text-center">All crypto payments are automatically linked to accounting ledger entries.</p>
          </div>
        </div>
      )}
    </div>
  );
}
