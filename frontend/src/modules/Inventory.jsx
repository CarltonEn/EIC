import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DEMO_PRODUCTS = [
  { id: 'd1', sku: 'PRD-001', name: 'EIC Enterprise License', category: 'Software', stock: 500, reorder_level: 50, unit_price: 99, currency: 'USD', status: 'In Stock' },
  { id: 'd2', sku: 'PRD-002', name: 'EFRIS Pro Module', category: 'Software', stock: 250, reorder_level: 30, unit_price: 29, currency: 'USD', status: 'In Stock' },
  { id: 'd3', sku: 'PRD-003', name: 'Network Switch', category: 'Hardware', stock: 12, reorder_level: 10, unit_price: 450, currency: 'USD', status: 'Low Stock' },
  { id: 'd4', sku: 'PRD-004', name: 'Cisco IP Phone', category: 'Hardware', stock: 4, reorder_level: 10, unit_price: 220, currency: 'USD', status: 'Critical' },
  { id: 'd5', sku: 'PRD-005', name: 'Office Desk', category: 'Furniture', stock: 22, reorder_level: 5, unit_price: 380, currency: 'USD', status: 'In Stock' },
];

const DEMO_ORDERS = [
  { id: 'po1', po_number: 'PO-0028', supplier: 'TechCo Ltd', items: 'Network Switches x5', amount: 8505000, currency: 'UGX', status: 'Delivered', created_at: '2024-12-10' },
  { id: 'po2', po_number: 'PO-0029', supplier: 'Kampala Electronics', items: 'Monitors x10', amount: 10584000, currency: 'UGX', status: 'In Transit', created_at: '2024-12-14' },
  { id: 'po3', po_number: 'PO-0030', supplier: 'Office Supplies Co', items: 'Stationery Bundle', amount: 450000, currency: 'UGX', status: 'Pending', created_at: '2024-12-16' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs font-bold text-white mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} className="text-xs text-neutral-400">Qty: {p.value}</p>)}
    </div>
  );
};

export default function Inventory() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [purchaseOrders, setPurchaseOrders] = useState(DEMO_ORDERS);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddPO, setShowAddPO] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', category: '', stock: '', reorder_level: '10', unit_price: '' });
  const [poForm, setPoForm] = useState({ supplier: '', items: '', amount: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('eicToken');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    apiFetch('/api/inventory', { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setProducts(d); })
      .catch(() => {});

    apiFetch('/api/purchase-orders', { headers })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setPurchaseOrders(d); })
      .catch(() => {});
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await apiFetch('/api/inventory', {
        method: 'POST', headers,
        body: JSON.stringify({ ...productForm, stock: Number(productForm.stock), reorder_level: Number(productForm.reorder_level), unit_price: Number(productForm.unit_price) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(prev => [data, ...prev]);
      setProductForm({ name: '', category: '', stock: '', reorder_level: '10', unit_price: '' });
      setShowAddProduct(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleAddPO = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const res = await apiFetch('/api/purchase-orders', {
        method: 'POST', headers,
        body: JSON.stringify({ ...poForm, amount: Number(poForm.amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPurchaseOrders(prev => [data, ...prev]);
      setPoForm({ supplier: '', items: '', amount: '' });
      setShowAddPO(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const lowStock = products.filter(p => p.status === 'Low Stock' || p.status === 'Critical').length;
  const openPOs = purchaseOrders.filter(p => p.status !== 'Delivered').length;

  const stockData = ['Software', 'Hardware', 'Furniture', 'Peripherals'].map(cat => ({
    cat,
    qty: products.filter(p => p.category === cat).reduce((s, p) => s + (p.stock || 0), 0),
  }));

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Inventory & Supply Chain</h1>
          <p className="text-neutral-500 text-sm mt-1">Product catalogue, stock levels, purchase orders, movements.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setShowAddProduct(!showAddProduct); setShowAddPO(false); }} className="bg-white/8 border border-white/10 text-white text-sm font-bold px-4 py-2.5 rounded-full hover:bg-white/15 transition-all">
            + Add Product
          </button>
          <button onClick={() => { setShowAddPO(!showAddPO); setShowAddProduct(false); }} className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
            + Create PO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length.toString() },
          { label: 'Low / Critical', value: lowStock.toString() },
          { label: 'Open POs', value: openPOs.toString() },
          { label: 'Locations', value: '3' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">{s.label}</div>
            <div className={`text-2xl font-black tracking-tight ${s.color || 'text-white'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {showAddProduct && (
        <form onSubmit={handleAddProduct} className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">New Product</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Product Name *', placeholder: 'EIC Module', required: true },
              { key: 'category', label: 'Category', placeholder: 'Software, Hardware…' },
              { key: 'stock', label: 'Stock Qty', placeholder: '100' },
              { key: 'reorder_level', label: 'Reorder At', placeholder: '10' },
              { key: 'unit_price', label: 'Unit Price (USD)', placeholder: '99' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input
                  required={f.required}
                  value={productForm[f.key]}
                  onChange={e => setProductForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-50">{saving ? 'Saving…' : 'Add Product'}</button>
            <button type="button" onClick={() => setShowAddProduct(false)} className="text-sm text-neutral-500 hover:text-white px-4 py-2.5">Cancel</button>
          </div>
        </form>
      )}

      {showAddPO && (
        <form onSubmit={handleAddPO} className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">New Purchase Order</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Supplier *</label>
              <input required value={poForm.supplier} onChange={e => setPoForm(p => ({ ...p, supplier: e.target.value }))} placeholder="TechCo Ltd" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Items</label>
              <input value={poForm.items} onChange={e => setPoForm(p => ({ ...p, items: e.target.value }))} placeholder="Network Switches x5" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">Amount (UGX)</label>
              <input value={poForm.amount} onChange={e => setPoForm(p => ({ ...p, amount: e.target.value }))} placeholder="5000000" className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm" />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full disabled:opacity-50">{saving ? 'Saving…' : 'Create PO'}</button>
            <button type="button" onClick={() => setShowAddPO(false)} className="text-sm text-neutral-500 hover:text-white px-4 py-2.5">Cancel</button>
          </div>
        </form>
      )}

      <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 w-fit">
        {[
          { id: 'products', label: 'Products' },
          { id: 'orders', label: 'Purchase Orders' },
          { id: 'analytics', label: 'Analytics' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">SKU</th>
              <th className="pb-3 text-left font-semibold">Product</th>
              <th className="pb-3 text-left font-semibold">Category</th>
              <th className="pb-3 text-right font-semibold">Stock</th>
              <th className="pb-3 text-right font-semibold">Reorder</th>
              <th className="pb-3 text-right font-semibold">Price</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.id} className="border-b border-white/4 hover:bg-white/[0.02]">
                  <td className="py-3 text-neutral-500 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 text-white font-medium">{p.name}</td>
                  <td className="py-3"><span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/8 text-neutral-400">{p.category || '—'}</span></td>
                  <td className="py-3 text-right text-white font-bold">{p.stock}</td>
                  <td className="py-3 text-right text-neutral-400">{p.reorder_level}</td>
                  <td className="py-3 text-right text-neutral-300">{p.currency || 'USD'} {(p.unit_price || 0).toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.status === 'In Stock' ? 'bg-white/10 text-white' : p.status === 'Low Stock' ? 'bg-white/5 text-neutral-300' : 'bg-white/5 text-neutral-500'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="text-center py-12 text-neutral-600">No products yet. Add your first product above.</div>}
        </div>
      )}

      {tab === 'orders' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-xs text-neutral-600 uppercase tracking-wider border-b border-white/6">
              <th className="pb-3 text-left font-semibold">PO #</th>
              <th className="pb-3 text-left font-semibold">Supplier</th>
              <th className="pb-3 text-left font-semibold">Items</th>
              <th className="pb-3 text-right font-semibold">Amount</th>
              <th className="pb-3 text-left font-semibold">Date</th>
              <th className="pb-3 text-left font-semibold">Status</th>
            </tr></thead>
            <tbody>
              {purchaseOrders.map((po, i) => (
                <tr key={po.id} className="border-b border-white/4">
                  <td className="py-3 text-neutral-400 font-mono text-xs">{po.po_number}</td>
                  <td className="py-3 text-white font-medium">{po.supplier}</td>
                  <td className="py-3 text-neutral-400 text-xs">{po.items || '—'}</td>
                  <td className="py-3 text-right text-white font-bold">{po.currency || 'UGX'} {(po.amount || 0).toLocaleString()}</td>
                  <td className="py-3 text-neutral-500 text-xs">{po.created_at ? po.created_at.split('T')[0] : '—'}</td>
                  <td className="py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${po.status === 'Delivered' ? 'bg-white/10 text-white' : po.status === 'In Transit' ? 'bg-white/8 text-neutral-300' : 'bg-white/5 text-neutral-500'}`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchaseOrders.length === 0 && <div className="text-center py-12 text-neutral-600">No purchase orders yet.</div>}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-1">Stock by Category</h3>
          <p className="text-xs text-neutral-600 mb-6">Current inventory levels</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stockData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="cat" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="qty" fill="rgba(255,255,255,0.18)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
