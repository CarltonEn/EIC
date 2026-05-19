import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ERP_MODULES, LAUNCH_WORKFLOWS } from './erpSuite';

const revenueData = [
  { month: 'Jan', revenue: 32.1, expenses: 18.4, tax: 4.2 },
  { month: 'Feb', revenue: 28.5, expenses: 16.2, tax: 3.8 },
  { month: 'Mar', revenue: 35.8, expenses: 19.1, tax: 4.9 },
  { month: 'Apr', revenue: 42.3, expenses: 22.7, tax: 5.6 },
  { month: 'May', revenue: 38.9, expenses: 20.5, tax: 5.1 },
  { month: 'Jun', revenue: 45.2, expenses: 24.1, tax: 6.0 },
  { month: 'Jul', revenue: 41.7, expenses: 23.3, tax: 5.5 },
  { month: 'Aug', revenue: 48.2, expenses: 26.8, tax: 6.3 },
  { month: 'Sep', revenue: 44.6, expenses: 25.1, tax: 5.8 },
  { month: 'Oct', revenue: 50.1, expenses: 28.4, tax: 6.7 },
  { month: 'Nov', revenue: 46.8, expenses: 27.0, tax: 6.2 },
  { month: 'Dec', revenue: 52.5, expenses: 30.2, tax: 7.1 },
];

const cashFlowData = [
  { month: 'Jan', inflows: 42.5, outflows: 28.1 },
  { month: 'Feb', inflows: 38.2, outflows: 25.4 },
  { month: 'Mar', inflows: 45.8, outflows: 30.2 },
  { month: 'Apr', inflows: 52.1, outflows: 34.6 },
  { month: 'May', inflows: 48.7, outflows: 32.1 },
  { month: 'Jun', inflows: 55.3, outflows: 37.2 },
  { month: 'Jul', inflows: 51.9, outflows: 35.8 },
  { month: 'Aug', inflows: 58.6, outflows: 40.1 },
  { month: 'Sep', inflows: 54.2, outflows: 38.4 },
  { month: 'Oct', inflows: 61.0, outflows: 42.3 },
  { month: 'Nov', inflows: 57.1, outflows: 40.8 },
  { month: 'Dec', inflows: 65.4, outflows: 45.2 },
];

const taxPieData = [
  { name: 'VAT (18%)', value: 41.2, fill: '#ffffff' },
  { name: 'WHT', value: 12.8, fill: '#a0a0a0' },
  { name: 'PAYE', value: 18.5, fill: '#666666' },
  { name: 'Income Tax', value: 27.5, fill: '#404040' },
];

const transactions = [
  { id: 'TXN-001', desc: 'Subscription Payment', amount: 'UGX 1,250,000', method: 'MTN MoMo', status: 'completed', date: '2024-12-15' },
  { id: 'TXN-002', desc: 'Invoice #INV-0042', amount: 'UGX 3,800,000', method: 'Bank Transfer', status: 'completed', date: '2024-12-14' },
  { id: 'TXN-003', desc: 'Supplier Payment', amount: 'UGX 2,100,000', method: 'Airtel Money', status: 'pending', date: '2024-12-14' },
  { id: 'TXN-004', desc: 'Payroll Dec 2024', amount: 'UGX 15,400,000', method: 'Centenary Bank', status: 'completed', date: '2024-12-13' },
  { id: 'TXN-005', desc: 'Office Supplies', amount: 'UGX 450,000', method: 'M-Pesa', status: 'completed', date: '2024-12-13' },
  { id: 'TXN-006', desc: 'Consulting Fee', amount: 'UGX 5,200,000', method: 'Stripe', status: 'completed', date: '2024-12-12' },
];

const methodBadge = () => 'bg-white/5 text-neutral-400 border-white/10';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs font-bold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-neutral-400">
          <span style={{ color: p.color }}>{p.name}</span>: {typeof p.value === 'number' ? `UGX ${p.value}M` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function SmartDashboard({ user }) {
  const [stats, setStats] = useState({ companies: 0, demoRequests: 0, payments: 0, revenue: 0, queued: 0, integrationsReady: 0 });
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('eicToken');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      apiFetch('/api/companies', { headers: h }).then(r => r.json()).catch(() => []),
      apiFetch('/api/admin/demo-requests', { headers: h }).then(r => r.json()).catch(() => []),
      apiFetch('/api/stripe/payment-intents?limit=100', { headers: h }).then(r => r.json()).catch(() => []),
      apiFetch('/api/integrations/status', { headers: h }).then(r => r.json()).catch(() => ({ providers: [] })),
    ]).then(([companies, reqs, payments, integrationStatus]) => {
      const succ = Array.isArray(payments) ? payments.filter(p => p.status === 'succeeded') : [];
      const queued = Array.isArray(payments) ? payments.filter(p => String(p.status).includes('queued') || p.status === 'checkout_created') : [];
      const providers = Array.isArray(integrationStatus.providers) ? integrationStatus.providers : [];
      setIntegrations(providers);
      setStats({
        companies: Array.isArray(companies) ? companies.length : 0,
        demoRequests: Array.isArray(reqs) ? reqs.length : 0,
        payments: succ.length,
        revenue: succ.reduce((s, p) => s + p.amount, 0) / 100,
        queued: queued.length,
        integrationsReady: providers.filter(p => p.available).length,
      });
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const kpis = [
    { label: 'Revenue', value: 'UGX 48.2M', change: '+12.4%', up: true },
    { label: 'Expenses', value: 'UGX 26.8M', change: '+5.2%', up: false },
    { label: 'Adapter Queue', value: String(stats.queued), change: 'tracked server-side', up: true },
    { label: 'Provider Readiness', value: `${stats.integrationsReady}/${integrations.length || 8}`, change: 'configured or mock', up: true },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-black text-white tracking-tight">{greeting}, {user?.name || user?.email?.split('@')[0]}</h1>
        <p className="text-neutral-500 text-sm mt-1">Real-time financial intelligence across all modules.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="stat-card anim-scale-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">{k.label}</div>
            <div className="text-2xl font-black text-white tracking-tight">{k.value}</div>
            <div className="text-xs font-bold mt-2 text-neutral-500">
              {k.change} <span className="text-neutral-700">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-1">Revenue vs Expenses vs Tax</h2>
          <p className="text-xs text-neutral-600 mb-6">FY 2024 — in millions UGX</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#ffffff" fill="rgba(255,255,255,0.08)" name="Revenue" />
              <Area type="monotone" dataKey="expenses" stackId="2" stroke="#666666" fill="rgba(102,102,102,0.08)" name="Expenses" />
              <Area type="monotone" dataKey="tax" stackId="3" stroke="#404040" fill="rgba(64,64,64,0.08)" name="Tax" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-1">Tax Breakdown</h2>
          <p className="text-xs text-neutral-600 mb-4">By type — FY 2024</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={taxPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {taxPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {taxPieData.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: t.fill }} />
                <span className="text-[10px] text-neutral-500">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Monthly Cash Flow</h2>
        <p className="text-xs text-neutral-600 mb-6">Inflows vs Outflows — UGX millions</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cashFlowData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="inflows" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} name="Inflows" />
            <Bar dataKey="outflows" fill="rgba(255,255,255,0.06)" radius={[4, 4, 0, 0]} name="Outflows" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-4">Live Transaction Ledger</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
                <th className="pb-3 text-left font-semibold">ID</th>
                <th className="pb-3 text-left font-semibold">Description</th>
                <th className="pb-3 text-left font-semibold">Amount</th>
                <th className="pb-3 text-left font-semibold">Method</th>
                <th className="pb-3 text-left font-semibold">Status</th>
                <th className="pb-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i} className="border-b border-white/4 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 text-neutral-500 font-mono text-xs">{t.id}</td>
                  <td className="py-3 text-white font-medium">{t.desc}</td>
                  <td className="py-3 text-white font-bold">{t.amount}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${methodBadge(t.method)}`}>{t.method}</span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold ${t.status === 'completed' ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 text-neutral-500 text-xs">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Integration Readiness</h2>
            <p className="mt-1 text-xs text-neutral-600">Server-side provider status. Missing credentials use mock adapters where supported.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-neutral-300">No secrets exposed</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {integrations.map(provider => (
            <div key={provider.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">{provider.label}</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-600">{provider.category}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${provider.configured ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : provider.available ? 'border-amber-300/20 bg-amber-300/10 text-amber-100' : 'border-rose-300/20 bg-rose-400/10 text-rose-100'}`}>
                  {provider.mode}
                </span>
              </div>
              <p className="text-xs leading-5 text-neutral-500">
                {provider.configured ? 'Configured server-side.' : provider.available ? 'Mock adapter active.' : 'Required credentials missing.'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="enterprise-surface rounded-2xl p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white">ERP Suite Launch Matrix</h2>
              <p className="mt-1 text-xs text-neutral-500">All 12 products mapped to operating depth and client-readiness.</p>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-100">12 modules</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ERP_MODULES.map((module) => (
              <div key={module.name} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{module.name}</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-600">{module.area}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${module.status === 'Launch ready' ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100' : 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100'}`}>{module.status}</span>
                </div>
                <p className="text-xs leading-5 text-neutral-400">{module.depth}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="enterprise-surface rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white">Integrated workflows</h2>
          <p className="mt-1 text-xs text-neutral-500">Sales-demo paths that prove the modules share one business system.</p>
          <div className="mt-5 space-y-3">
            {LAUNCH_WORKFLOWS.map((flow, index) => (
              <div key={flow} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="mb-2 text-xs font-black text-emerald-200">Workflow {index + 1}</div>
                <p className="text-sm leading-6 text-neutral-300">{flow}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
