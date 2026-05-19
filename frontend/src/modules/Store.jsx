import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const categories = ['All', 'Finance', 'Payments', 'Tax', 'AI', 'Integration', 'Security'];

const products = [
  { id: 1, name: 'EFRIS Pro Add-on', category: 'Tax', price: 29, period: '/mo', desc: 'Advanced URA EFRIS automation with bulk filing, credit/debit note mgmt, offline queuing.', badge: 'Popular', rating: 4.9, reviews: 142, features: ['Bulk filing', 'Credit notes', 'Offline mode'] },
  { id: 2, name: 'Multi-Currency Engine', category: 'Finance', price: 19, period: '/mo', desc: 'Real-time exchange rates for 40+ currencies. Auto-conversion on invoices and payments.', badge: null, rating: 4.8, reviews: 89, features: ['40+ currencies', 'Auto convert', 'Live rates'] },
  { id: 3, name: 'Payroll Module', category: 'Finance', price: 39, period: '/mo', desc: 'Full payroll processing with NSSF/PAYE statutory calculations, payslips, and bank disbursement.', badge: 'New', rating: 4.7, reviews: 56, features: ['NSSF/PAYE', 'Payslips', 'Auto disburse'] },
  { id: 4, name: 'WhatsApp CRM', category: 'Integration', price: 24, period: '/mo', desc: 'WhatsApp Business API integration. Broadcast campaigns, chatbot, and lead capture.', badge: null, rating: 4.6, reviews: 203, features: ['Chatbot', 'Campaigns', 'Lead capture'] },
  { id: 5, name: 'ARIA Advanced', category: 'AI', price: 49, period: '/mo', desc: 'Enhanced AI with 12-month forecasting, anomaly detection, and automated report generation.', badge: 'Premium', rating: 4.9, reviews: 78, features: ['Forecasting', 'Anomaly detect', 'Auto reports'] },
  { id: 6, name: 'Crypto Gateway', category: 'Payments', price: 14, period: '/mo', desc: 'Accept BTC, ETH, USDT, Pi Coin payments. Auto-convert to fiat and settle to bank.', badge: null, rating: 4.5, reviews: 167, features: ['7 cryptos', 'Auto convert', 'Bank settle'] },
  { id: 7, name: 'PCI DSS Compliance', category: 'Security', price: 59, period: '/mo', desc: 'Full PCI DSS Level 1 compliance suite. Automated scanning, reporting, and remediation.', badge: null, rating: 4.8, reviews: 34, features: ['Auto scan', 'Reports', 'Remediation'] },
  { id: 8, name: 'Kenya KRA iTax', category: 'Tax', price: 19, period: '/mo', desc: 'Direct KRA iTax integration for Kenyan businesses. VAT, PAYE, WHT auto-filing.', badge: null, rating: 4.7, reviews: 91, features: ['Auto filing', 'PAYE calc', 'WHT mgmt'] },
  { id: 9, name: 'Plaid Banking', category: 'Integration', price: 29, period: '/mo', desc: 'Connect US/UK/EU bank accounts via Plaid. Auto transaction sync and categorization.', badge: 'New', rating: 4.6, reviews: 45, features: ['Bank linking', 'Auto sync', 'Categorize'] },
  { id: 10, name: 'Email Campaigns', category: 'Integration', price: 19, period: '/mo', desc: 'Built-in email marketing with templates, A/B testing, and CRM-integrated analytics.', badge: null, rating: 4.5, reviews: 122, features: ['Templates', 'A/B testing', 'Analytics'] },
  { id: 11, name: 'Flutterwave Gateway', category: 'Payments', price: 9, period: '/mo', desc: 'Pan-African payment gateway. Accept cards, mobile money, and bank transfers across 34 countries.', badge: null, rating: 4.8, reviews: 256, features: ['34 countries', 'Multi-method', 'Auto settle'] },
  { id: 12, name: 'Document OCR', category: 'AI', price: 34, period: '/mo', desc: 'AI-powered document scanning. Extract data from invoices, receipts, and contracts automatically.', badge: null, rating: 4.4, reviews: 67, features: ['Invoice scan', 'Receipt OCR', 'Auto extract'] },
];

const renderStars = (rating) => {
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < full ? 'white' : 'none'} stroke={i < full ? 'white' : '#555'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="text-xs text-neutral-500 ml-1">{rating}</span>
    </div>
  );
};

export default function Store() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product) => {
    if (!cart.find(c => c.id === product.id)) {
      setCart([...cart, product]);
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const totalPrice = cart.reduce((s, c) => s + c.price, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Marketplace</h1>
          <p className="text-neutral-500 text-sm mt-1">Add-ons, integrations, and premium features for your EIC platform.</p>
        </div>
        <button onClick={() => setShowCart(!showCart)} className="relative bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
          Cart ({cart.length})
          {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center">{cart.length}</span>}
        </button>
      </div>

      {showCart && cart.length > 0 && (
        <div className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Your Cart</h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-neutral-500">{item.category}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-white">${item.price}/mo</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-xs text-neutral-500 hover:text-white">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/6">
            <div>
              <span className="text-xs text-neutral-500">Monthly Total:</span>
              <span className="text-lg font-black text-white ml-2">${totalPrice}/mo</span>
            </div>
            <button onClick={() => navigate('/payment')} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-neutral-100 transition-all">
              Subscribe →
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search add-ons..."
            className="w-full bg-[#141414] border border-white/8 rounded-xl pl-11 pr-4 py-3 text-sm"
          />
        </div>
        <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/6 overflow-x-auto">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeCategory === c ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-[#141414] border border-white/6 rounded-2xl overflow-hidden hover:border-white/14 transition-all group">
            <div className="h-32 bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
              <div className="text-4xl font-black text-white/5 select-none">{p.category}</div>
              {p.badge && (
                <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${p.badge === 'Popular' ? 'bg-white text-black' : p.badge === 'New' ? 'bg-white/10 text-neutral-300 border border-white/15' : 'bg-white/5 text-neutral-400 border border-white/10'}`}>
                  {p.badge}
                </span>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">{p.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-neutral-500 mt-1 inline-block">{p.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">${p.price}</div>
                  <div className="text-[10px] text-neutral-600">{p.period}</div>
                </div>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mb-3">{p.desc}</p>
              <div className="flex items-center justify-between mb-4">
                {renderStars(p.rating)}
                <span className="text-[10px] text-neutral-600">{p.reviews} reviews</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {p.features.map((f, i) => (
                  <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/4 border border-white/6 text-neutral-400">{f}</span>
                ))}
              </div>
              <button
                onClick={() => addToCart(p)}
                disabled={cart.find(c => c.id === p.id)}
                className={`w-full text-sm font-bold py-2.5 rounded-xl transition-all ${cart.find(c => c.id === p.id) ? 'bg-white/5 text-neutral-600 border border-white/6 cursor-default' : 'bg-white text-black hover:bg-neutral-100'}`}
              >
                {cart.find(c => c.id === p.id) ? 'Added to cart' : 'Add to cart →'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm text-neutral-500">No add-ons found matching your search.</div>
        </div>
      )}
    </div>
  );
}
