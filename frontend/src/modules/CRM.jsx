import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DEMO_CONTACTS = [
  { name: 'David Mukasa', company: 'Kampala Tech Ltd', email: 'david@kampalatech.ug', country: 'Uganda', score: 92, ltv: 'UGX 48M', stage: 'Closed', status: 'Active' },
  { name: 'Sarah Achieng', company: 'Safari Solutions', email: 'sarah@safari.co.ke', country: 'Kenya', score: 78, ltv: 'KES 3.2M', stage: 'Negotiation', status: 'Active' },
  { name: 'James Odhiambo', company: 'Nile Logistics', email: 'james@nilelogistics.ug', country: 'Uganda', score: 85, ltv: 'UGX 62M', stage: 'Closed', status: 'Active' },
  { name: 'Amina Hassan', company: 'Dar Express', email: 'amina@darexpress.tz', country: 'Tanzania', score: 64, ltv: 'TZS 15M', stage: 'Proposal', status: 'Active' },
  { name: 'Peter Okafor', company: 'Lagos Digital', email: 'peter@lagosdigital.ng', country: 'Nigeria', score: 71, ltv: 'NGN 8.5M', stage: 'Qualified', status: 'Active' },
  { name: 'Grace Nakamya', company: 'Mango Digital', email: 'grace@mango.ug', country: 'Uganda', score: 45, ltv: 'UGX 12M', stage: 'Lead', status: 'Inactive' },
];

const DEMO_DEALS = [
  { id: 'd1', title: 'EIC Enterprise License', company: 'Kampala Tech Ltd', contact: 'David Mukasa', value: 48000, currency: 'USD', stage: 'Closed', probability: 100, close_date: '2024-12-01', owner: 'Sarah' },
  { id: 'd2', title: 'EFRIS Integration Project', company: 'Safari Solutions', contact: 'Sarah Achieng', value: 22000, currency: 'USD', stage: 'Negotiation', probability: 75, close_date: '2025-01-31', owner: 'James' },
  { id: 'd3', title: 'Payroll Module Setup', company: 'Nile Logistics', contact: 'James Odhiambo', value: 15000, currency: 'USD', stage: 'Proposal', probability: 40, close_date: '2025-02-15', owner: 'Sarah' },
  { id: 'd4', title: 'Pi Wallet Integration', company: 'Lagos Digital', contact: 'Peter Okafor', value: 8500, currency: 'USD', stage: 'Qualified', probability: 25, close_date: '2025-03-31', owner: 'James' },
  { id: 'd5', title: 'CRM Annual License', company: 'Mango Digital', contact: 'Grace Nakamya', value: 3600, currency: 'USD', stage: 'Lead', probability: 10, close_date: '2025-04-30', owner: 'Admin' },
];

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed'];

const countryData = [
  { country: 'Uganda', revenue: 142 },
  { country: 'Kenya', revenue: 89 },
  { country: 'Tanzania', revenue: 45 },
  { country: 'Nigeria', revenue: 38 },
  { country: 'Rwanda', revenue: 22 },
  { country: 'S. Africa', revenue: 18 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs font-bold text-white mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} className="text-xs text-neutral-400">Revenue: UGX {p.value}M</p>)}
    </div>
  );
};

export default function CRM() {
  const [tab, setTab] = useState('contacts');
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [deals, setDeals] = useState(DEMO_DEALS);
  const [dealForm, setDealForm] = useState({ title: '', company: '', contact: '', value: '', currency: 'USD', stage: 'Lead', probability: '10', close_date: '', owner: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('eicToken');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    apiFetch('/api/deals', { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setDeals(d); })
      .catch(() => {});
  }, []);

  const handleAddDeal = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await apiFetch('/api/deals', {
        method: 'POST', headers,
        body: JSON.stringify({ ...dealForm, value: Number(dealForm.value) || 0, probability: Number(dealForm.probability) || 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeals(prev => [data, ...prev]);
      setDealForm({ title: '', company: '', contact: '', value: '', currency: 'USD', stage: 'Lead', probability: '10', close_date: '', owner: '' });
      setShowAddDeal(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const moveDeal = async (deal, newStage) => {
    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: newStage } : d));
    try {
      await apiFetch(`/api/deals/${deal.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ ...deal, stage: newStage }),
      });
    } catch (_) {}
  };

  const pipelineValue = deals.reduce((s, d) => s + ((d.value || 0) * (d.probability || 0) / 100), 0);
  const activeDeals = deals.filter(d => d.stage !== 'Closed').length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">CRM</h1>
          <p className="text-neutral-500 text-sm mt-1">Customer relationships, AI lead scoring, pipeline management.</p>
        </div>
        <button onClick={() => setShowAddDeal(!showAddDeal)} className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
          + Add Deal
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Contacts', value: DEMO_CONTACTS.length.toString() },
          { label: 'Active Deals', value: activeDeals.toString() },
          { label: 'Pipeline Value', value: `$${Math.round(pipelineValue / 1000)}K` },
          { label: 'Avg Lead Score', value: '72' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">{s.label}</div>
            <div className="text-2xl font-black text-white tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {showAddDeal && (
        <form onSubmit={handleAddDeal} className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">New Deal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Deal Title *</label>
              <input required value={dealForm.title} onChange={e => setDealForm(p => ({ ...p, title: e.target.value }))} placeholder="EIC Enterprise License" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            {[
              { key: 'company', label: 'Company', placeholder: 'Kampala Tech Ltd' },
              { key: 'contact', label: 'Contact', placeholder: 'David Mukasa' },
              { key: 'value', label: 'Deal Value (USD)', placeholder: '15000' },
              { key: 'owner', label: 'Owner', placeholder: 'Sarah' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input value={dealForm[f.key]} onChange={e => setDealForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Stage</label>
              <select value={dealForm.stage} onChange={e => setDealForm(p => ({ ...p, stage: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm">
                {STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Probability %</label>
              <input type="number" min="0" max="100" value={dealForm.probability} onChange={e => setDealForm(p => ({ ...p, probability: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Close Date</label>
              <input type="date" value={dealForm.close_date} onChange={e => setDealForm(p => ({ ...p, close_date: e.target.value }))} className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-50">{saving ? 'Saving…' : 'Create Deal'}</button>
            <button type="button" onClick={() => setShowAddDeal(false)} className="text-sm text-neutral-500 hover:text-white px-4 py-2.5">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {[
          { id: 'contacts', label: 'Contacts' },
          { id: 'pipeline', label: 'Deals Pipeline' },
          { id: 'analytics', label: 'Analytics' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'contacts' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Name</th>
              <th className="pb-3 text-left font-semibold">Company</th>
              <th className="pb-3 text-left font-semibold">Country</th>
              <th className="pb-3 text-center font-semibold">AI Score</th>
              <th className="pb-3 text-right font-semibold">Lifetime Value</th>
              <th className="pb-3 text-left font-semibold">Stage</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {DEMO_CONTACTS.map((c, i) => (
                <tr key={i} className="border-b border-white/4 hover:bg-white/[0.02] cursor-pointer">
                  <td className="py-3">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-xs text-neutral-600">{c.email}</div>
                  </td>
                  <td className="py-3 text-neutral-300">{c.company}</td>
                  <td className="py-3 text-neutral-400">{c.country}</td>
                  <td className="py-3 text-center">
                    <span className={`font-black ${c.score >= 80 ? 'text-white' : c.score >= 60 ? 'text-neutral-400' : 'text-neutral-600'}`}>{c.score}</span>
                  </td>
                  <td className="py-3 text-right text-white font-bold">{c.ltv}</td>
                  <td className="py-3"><span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400">{c.stage}</span></td>
                  <td className="py-3"><span className={`text-xs font-semibold ${c.status === 'Active' ? 'text-white' : 'text-neutral-600'}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const cards = deals.filter(d => d.stage === stage);
            const stageVal = cards.reduce((s, d) => s + (d.value || 0), 0);
            return (
              <div key={stage} className="min-w-[240px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{stage}</h3>
                  <span className="text-xs bg-white/5 border border-white/8 px-2 py-0.5 rounded-full text-neutral-500">{cards.length}</span>
                </div>
                {stageVal > 0 && <p className="text-xs text-neutral-600 mb-2">${stageVal.toLocaleString()} total</p>}
                <div className="space-y-3">
                  {cards.map((d, i) => (
                    <div key={d.id || i} className="bg-[#141414] border border-white/6 rounded-xl p-4 hover:border-white/14 transition-all group">
                      <div className="text-sm font-bold text-white mb-1">{d.title}</div>
                      <div className="text-xs text-neutral-500 mb-1">{d.company || '—'}</div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutral-300 font-bold">${(d.value || 0).toLocaleString()}</span>
                        <span className="text-xs text-neutral-600">{d.probability || 0}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-white/25 rounded-full" style={{ width: `${d.probability || 0}%` }} />
                      </div>
                      <div className="hidden group-hover:flex gap-1 flex-wrap">
                        {STAGES.filter(s => s !== stage).map(s => (
                          <button key={s} onClick={() => moveDeal(d, s)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-500 hover:text-white hover:bg-white/10">
                            → {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && <div className="border-2 border-dashed border-white/6 rounded-xl p-6 text-center text-xs text-neutral-600">No deals</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-1">Revenue by Country</h3>
          <p className="text-xs text-neutral-600 mb-6">Client revenue distribution — UGX millions</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="country" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
