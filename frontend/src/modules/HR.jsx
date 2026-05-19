import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DEMO_EMPLOYEES = [
  { id: 'demo-1', emp_id: 'EMP-001', name: 'David Mukasa', department: 'Finance', role: 'CFO', salary: 6500000, currency: 'UGX', status: 'Active', leave_days: 12, joined_date: '2021-03-15' },
  { id: 'demo-2', emp_id: 'EMP-002', name: 'Sarah Achieng', department: 'Engineering', role: 'Lead Dev', salary: 5200000, currency: 'UGX', status: 'Active', leave_days: 8, joined_date: '2022-01-10' },
  { id: 'demo-3', emp_id: 'EMP-003', name: 'James Odhiambo', department: 'Sales', role: 'Sales Manager', salary: 4800000, currency: 'UGX', status: 'Active', leave_days: 15, joined_date: '2020-08-22' },
  { id: 'demo-4', emp_id: 'EMP-004', name: 'Amina Hassan', department: 'Marketing', role: 'Marketing Lead', salary: 4200000, currency: 'UGX', status: 'Active', leave_days: 10, joined_date: '2022-06-01' },
  { id: 'demo-5', emp_id: 'EMP-005', name: 'Grace Nakamya', department: 'Operations', role: 'Ops Director', salary: 5800000, currency: 'UGX', status: 'On Leave', leave_days: 3, joined_date: '2019-05-20' },
];

const DEMO_LEAVE = [
  { id: 'l1', employee_name: 'Grace Nakamya', leave_type: 'Annual Leave', from_date: '2024-12-10', to_date: '2024-12-20', days: 10, status: 'Approved' },
  { id: 'l2', employee_name: 'Sarah Achieng', leave_type: 'Annual Leave', from_date: '2025-01-06', to_date: '2025-01-10', days: 5, status: 'Pending' },
  { id: 'l3', employee_name: 'James Odhiambo', leave_type: 'Paternity Leave', from_date: '2025-01-15', to_date: '2025-01-29', days: 15, status: 'Pending' },
];

const payrollData = [
  { month: 'Jul', gross: 38.2, paye: 7.1, net: 28.8 },
  { month: 'Aug', gross: 38.5, paye: 7.2, net: 29.0 },
  { month: 'Sep', gross: 39.1, paye: 7.3, net: 29.5 },
  { month: 'Oct', gross: 40.2, paye: 7.5, net: 30.3 },
  { month: 'Nov', gross: 40.8, paye: 7.6, net: 30.8 },
  { month: 'Dec', gross: 42.5, paye: 7.9, net: 32.0 },
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

export default function HR() {
  const [tab, setTab] = useState('employees');
  const [showPayroll, setShowPayroll] = useState(false);
  const [employees, setEmployees] = useState(DEMO_EMPLOYEES);
  const [leaveRequests, setLeaveRequests] = useState(DEMO_LEAVE);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', department: '', role: '', email: '', salary: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('eicToken');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    apiFetch('/api/employees', { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setEmployees(d); })
      .catch(() => {});

    apiFetch('/api/leave-requests', { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setLeaveRequests(d); })
      .catch(() => {});
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await apiFetch('/api/employees', {
        method: 'POST', headers,
        body: JSON.stringify({ ...addForm, salary: Number(addForm.salary) || 0, currency: 'UGX' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmployees(prev => [data, ...prev]);
      setAddForm({ name: '', department: '', role: '', email: '', salary: '' });
      setShowAddEmp(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleApproveLeave = async (id) => {
    await apiFetch(`/api/leave-requests/${id}/approve`, { method: 'PUT', headers });
    setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: 'Approved' } : l));
  };

  const handleDeclineLeave = async (id) => {
    await apiFetch(`/api/leave-requests/${id}/decline`, { method: 'PUT', headers });
    setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status: 'Declined' } : l));
  };

  const totalSalary = employees.reduce((s, e) => s + (e.salary || 0), 0);
  const paye = Math.round(totalSalary * 0.185);
  const nssf = Math.round(totalSalary * 0.05);
  const net = totalSalary - paye - nssf;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">HR & Payroll</h1>
          <p className="text-neutral-500 text-sm mt-1">Employee records, leave management, payroll processing.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddEmp(!showAddEmp)} className="bg-white/8 border border-white/10 text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-white/15 transition-all">
            + Add Employee
          </button>
          <button onClick={() => setShowPayroll(!showPayroll)} className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
            Run Payroll →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: employees.length.toString() },
          { label: 'Monthly Payroll', value: `UGX ${(totalSalary / 1e6).toFixed(1)}M` },
          { label: 'On Leave Today', value: onLeave.toString() },
          { label: 'NSSF Compliant', value: '100%' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">{s.label}</div>
            <div className={`text-2xl font-black tracking-tight ${s.color || 'text-white'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {showAddEmp && (
        <form onSubmit={handleAddEmployee} className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">New Employee</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Full Name *', placeholder: 'David Mukasa', required: true },
              { key: 'email', label: 'Email', placeholder: 'david@company.com' },
              { key: 'department', label: 'Department', placeholder: 'Finance' },
              { key: 'role', label: 'Role', placeholder: 'Senior Accountant' },
              { key: 'salary', label: 'Monthly Salary (UGX)', placeholder: '3500000' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input
                  required={f.required}
                  value={addForm[f.key]}
                  onChange={e => setAddForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Employee'}
            </button>
            <button type="button" onClick={() => setShowAddEmp(false)} className="text-sm text-neutral-500 hover:text-white px-4 py-2.5">Cancel</button>
          </div>
        </form>
      )}

      {showPayroll && (
        <div className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Payroll Run — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Gross Salary', value: `UGX ${totalSalary.toLocaleString()}` },
              { label: 'PAYE (18.5%)', value: `UGX ${paye.toLocaleString()}` },
              { label: 'NSSF (5%)', value: `UGX ${nssf.toLocaleString()}` },
              { label: 'Net Disbursement', value: `UGX ${net.toLocaleString()}` },
            ].map((item, i) => (
              <div key={i} className="bg-[#0a0a0a] border border-white/6 rounded-xl p-4">
                <div className="text-xs text-neutral-500 mb-1">{item.label}</div>
                <div className={`text-lg font-black ${item.color || 'text-white'}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full">Approve & Disburse</button>
            <button onClick={() => setShowPayroll(false)} className="text-sm text-neutral-500 hover:text-white px-4 py-2.5">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {[
          { id: 'employees', label: 'Employees' },
          { id: 'leave', label: 'Leave' },
          { id: 'payroll', label: 'Payroll History' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'employees' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Employee</th>
              <th className="pb-3 text-left font-semibold">Dept</th>
              <th className="pb-3 text-left font-semibold">Role</th>
              <th className="pb-3 text-right font-semibold">Salary (UGX)</th>
              <th className="pb-3 text-left font-semibold">Leave Days</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {employees.map((e, i) => (
                <tr key={e.id} className="border-b border-white/4 hover:bg-white/[0.02]">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(e.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{e.name}</div>
                        <div className="text-xs text-neutral-600">{e.emp_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-neutral-400">{e.department || '—'}</td>
                  <td className="py-3 text-neutral-300">{e.role || '—'}</td>
                  <td className="py-3 text-right text-white font-bold">{(e.salary || 0).toLocaleString()}</td>
                  <td className="py-3 text-neutral-400">{e.leave_days ?? 14} days</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${e.status === 'Active' ? 'bg-white/10 text-white' : 'bg-white/5 text-neutral-500'}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {employees.length === 0 && (
            <div className="text-center py-12 text-neutral-600">No employees found. Add your first employee above.</div>
          )}
        </div>
      )}

      {tab === 'leave' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4">Leave Requests</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Employee</th>
              <th className="pb-3 text-left font-semibold">Type</th>
              <th className="pb-3 text-left font-semibold">From</th>
              <th className="pb-3 text-left font-semibold">To</th>
              <th className="pb-3 text-center font-semibold">Days</th>
              <th className="pb-3 text-left font-semibold">Status</th>
              <th className="pb-3 text-right font-semibold">Action</th>
            </tr></thead>
            <tbody>
              {leaveRequests.map((l, i) => (
                <tr key={l.id || i} className="border-b border-white/4">
                  <td className="py-3 text-white font-medium">{l.employee_name}</td>
                  <td className="py-3 text-neutral-400">{l.leave_type}</td>
                  <td className="py-3 text-neutral-500 text-xs">{l.from_date}</td>
                  <td className="py-3 text-neutral-500 text-xs">{l.to_date}</td>
                  <td className="py-3 text-center text-white font-bold">{l.days}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${l.status === 'Approved' ? 'bg-white/10 text-white' : l.status === 'Declined' ? 'bg-white/5 text-neutral-500 line-through' : 'bg-white/5 text-neutral-400'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {l.status === 'Pending' && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleApproveLeave(l.id)} className="text-xs text-neutral-300 hover:text-white hover:underline">Approve</button>
                        <button onClick={() => handleDeclineLeave(l.id)} className="text-xs text-neutral-500 hover:text-neutral-300 hover:underline">Decline</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-1">Payroll History</h3>
          <p className="text-xs text-neutral-600 mb-6">Last 6 months — UGX millions</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={payrollData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gross" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} name="Gross" />
              <Bar dataKey="paye" fill="rgba(255,255,255,0.07)" radius={[4, 4, 0, 0]} name="PAYE" />
              <Bar dataKey="net" fill="rgba(255,255,255,0.25)" radius={[4, 4, 0, 0]} name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
