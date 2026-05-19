import React, { useState } from 'react';

const assets = [
  { tag: 'IT-001', name: 'Dell OptiPlex 7090', type: 'Desktop', dept: 'Finance', assigned: 'David M.', status: 'Active', warranty: '2025-06-15' },
  { tag: 'IT-002', name: 'MacBook Pro 14"', type: 'Laptop', dept: 'Engineering', assigned: 'Sarah A.', status: 'Active', warranty: '2026-01-20' },
  { tag: 'IT-003', name: 'HP LaserJet Pro', type: 'Printer', dept: 'Admin', assigned: 'Shared', status: 'Active', warranty: '2025-03-10' },
  { tag: 'IT-004', name: 'Cisco Catalyst Switch', type: 'Network', dept: 'IT', assigned: 'Server Room', status: 'Active', warranty: '2027-08-22' },
  { tag: 'IT-005', name: 'Samsung 27" Monitor', type: 'Display', dept: 'Marketing', assigned: 'James O.', status: 'Active', warranty: '2025-09-30' },
  { tag: 'IT-006', name: 'Lenovo ThinkPad', type: 'Laptop', dept: 'Sales', assigned: 'Amina H.', status: 'Repair', warranty: '2025-12-18' },
  { tag: 'IT-007', name: 'Ubiquiti UniFi AP', type: 'Network', dept: 'IT', assigned: 'Floor 2', status: 'Active', warranty: '2026-04-05' },
  { tag: 'IT-008', name: 'Canon ImageRunner', type: 'Printer', dept: 'Legal', assigned: 'Shared', status: 'Active', warranty: '2025-07-12' },
];

const securityMetrics = [
  { name: 'Firewall', score: 98, status: 'Excellent', details: 'FortiGate 100F — All rules updated' },
  { name: 'Antivirus', score: 95, status: 'Good', details: 'CrowdStrike Falcon — 142/142 endpoints' },
  { name: 'Patches', score: 88, status: 'Good', details: '3 pending updates — non-critical' },
  { name: 'Access Control', score: 100, status: 'Excellent', details: 'Azure AD + MFA enforced' },
  { name: 'Backup', score: 92, status: 'Good', details: 'Last backup: 2h ago — AWS S3' },
];

const licenses = [
  { software: 'Microsoft 365 E3', vendor: 'Microsoft', seats: '50/50', expiry: '2025-03-15', cost: 'USD 1,800/mo', status: 'Active' },
  { software: 'Adobe Creative Cloud', vendor: 'Adobe', seats: '12/15', expiry: '2025-06-30', cost: 'USD 720/mo', status: 'Active' },
  { software: 'Slack Business+', vendor: 'Slack', seats: '48/50', expiry: '2025-01-15', cost: 'USD 600/mo', status: 'Expiring Soon' },
  { software: 'GitHub Enterprise', vendor: 'GitHub', seats: '25/30', expiry: '2025-09-22', cost: 'USD 525/mo', status: 'Active' },
  { software: 'Jira Premium', vendor: 'Atlassian', seats: '30/50', expiry: '2025-12-01', cost: 'USD 450/mo', status: 'Active' },
  { software: 'Zoom Business', vendor: 'Zoom', seats: '45/50', expiry: '2024-12-31', cost: 'USD 375/mo', status: 'Expiring Soon' },
];

const networkDevices = [
  { device: 'Core Router', ip: '10.0.0.1', uptime: '99.98%', latency: '1ms', bandwidth: '940 Mbps', status: 'Online' },
  { device: 'Switch — Floor 1', ip: '10.0.1.1', uptime: '99.95%', latency: '2ms', bandwidth: '890 Mbps', status: 'Online' },
  { device: 'Switch — Floor 2', ip: '10.0.2.1', uptime: '99.92%', latency: '3ms', bandwidth: '920 Mbps', status: 'Online' },
  { device: 'WiFi AP — Main', ip: '10.0.3.1', uptime: '99.88%', latency: '5ms', bandwidth: '450 Mbps', status: 'Online' },
  { device: 'WiFi AP — Conference', ip: '10.0.3.2', uptime: '98.50%', latency: '8ms', bandwidth: '380 Mbps', status: 'Warning' },
  { device: 'Firewall', ip: '10.0.0.254', uptime: '100%', latency: '<1ms', bandwidth: '1 Gbps', status: 'Online' },
];

export default function ITManagement() {
  const [tab, setTab] = useState('assets');

  const overallScore = Math.round(securityMetrics.reduce((s, m) => s + m.score, 0) / securityMetrics.length);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">IT Management</h1>
          <p className="text-neutral-500 text-sm mt-1">Asset register, security scoring, licenses, network monitoring.</p>
        </div>
        <button className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
          + Register Asset
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: assets.length.toString() },
          { label: 'Security Score', value: `${overallScore}%` },
          { label: 'Active Licenses', value: licenses.length.toString() },
          { label: 'Network Devices', value: networkDevices.length.toString() },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">{s.label}</div>
            <div className={`text-2xl font-black tracking-tight ${s.color || 'text-white'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {[
          { id: 'assets', label: 'Asset Register' },
          { id: 'security', label: 'Security' },
          { id: 'licenses', label: 'Licenses' },
          { id: 'network', label: 'Network' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'assets' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Tag</th>
              <th className="pb-3 text-left font-semibold">Asset Name</th>
              <th className="pb-3 text-left font-semibold">Type</th>
              <th className="pb-3 text-left font-semibold">Department</th>
              <th className="pb-3 text-left font-semibold">Assigned To</th>
              <th className="pb-3 text-left font-semibold">Warranty</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {assets.map((a, i) => (
                <tr key={i} className="border-b border-white/4 hover:bg-white/[0.02]">
                  <td className="py-3 text-neutral-500 font-mono text-xs">{a.tag}</td>
                  <td className="py-3 text-white font-medium">{a.name}</td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/8 text-neutral-400">{a.type}</span></td>
                  <td className="py-3 text-neutral-400">{a.dept}</td>
                  <td className="py-3 text-neutral-300">{a.assigned}</td>
                  <td className="py-3 text-neutral-500 text-xs">{a.warranty}</td>
                  <td className="py-3"><span className={`text-xs font-semibold ${a.status === 'Active' ? 'text-white' : 'text-neutral-500'}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 text-center">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-2">Overall Security Health</div>
            <div className="text-6xl font-black tracking-tight text-white">{overallScore}%</div>
            <div className="text-sm text-neutral-500 mt-1">All systems operational</div>
          </div>
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {securityMetrics.map((m, i) => (
              <div key={i} className="bg-[#141414] border border-white/6 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-white">{m.name}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-neutral-400">{m.status}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full bg-white/40" style={{ width: `${m.score}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{m.details}</span>
                  <span className="text-xs font-bold text-white">{m.score}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'licenses' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Software</th>
              <th className="pb-3 text-left font-semibold">Vendor</th>
              <th className="pb-3 text-left font-semibold">Seats</th>
              <th className="pb-3 text-left font-semibold">Expiry</th>
              <th className="pb-3 text-right font-semibold">Cost</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {licenses.map((l, i) => (
                <tr key={i} className="border-b border-white/4">
                  <td className="py-3 text-white font-medium">{l.software}</td>
                  <td className="py-3 text-neutral-400">{l.vendor}</td>
                  <td className="py-3 text-neutral-300">{l.seats}</td>
                  <td className="py-3 text-neutral-500 text-xs">{l.expiry}</td>
                  <td className="py-3 text-right text-white font-bold">{l.cost}</td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full border border-white/10 ${l.status === 'Active' ? 'bg-white/10 text-white' : 'bg-white/5 text-neutral-500'}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-white/6 flex justify-between">
            <span className="text-xs text-neutral-500">Total Monthly License Cost:</span>
            <span className="text-sm font-bold text-white">USD 4,470/mo</span>
          </div>
        </div>
      )}

      {tab === 'network' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4">Network Monitoring</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">Device</th>
              <th className="pb-3 text-left font-semibold">IP Address</th>
              <th className="pb-3 text-right font-semibold">Uptime</th>
              <th className="pb-3 text-right font-semibold">Latency</th>
              <th className="pb-3 text-right font-semibold">Bandwidth</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {networkDevices.map((d, i) => (
                <tr key={i} className="border-b border-white/4">
                  <td className="py-3 text-white font-medium">{d.device}</td>
                  <td className="py-3 text-neutral-400 font-mono text-xs">{d.ip}</td>
                  <td className="py-3 text-right text-neutral-300">{d.uptime}</td>
                  <td className="py-3 text-right text-neutral-300">{d.latency}</td>
                  <td className="py-3 text-right text-neutral-300">{d.bandwidth}</td>
                  <td className="py-3"><span className={`text-xs px-2.5 py-1 rounded-full border border-white/10 ${d.status === 'Online' ? 'bg-white/10 text-white' : 'bg-white/5 text-neutral-400'}`}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
