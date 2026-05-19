import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import PaymentPage from './PaymentPage';
import SmartDashboard from './modules/SmartDashboard';
import Accounting from './modules/Accounting';
import EFRIS from './modules/EFRIS';
import Wallet from './modules/Wallet';
import Banking from './modules/Banking';
import CRM from './modules/CRM';
import ITManagement from './modules/ITManagement';
import Crypto from './modules/Crypto';
import ARIA from './modules/ARIA';
import Store from './modules/Store';
import HR from './modules/HR';
import Inventory from './modules/Inventory';
import Projects from './modules/Projects';
import { apiFetch } from './api';

/* ─────────────────────────── LOGO ─────────────────────────── */
function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="white"/>
      <rect x="7" y="9" width="8" height="2" fill="#0a0a0a"/>
      <rect x="7" y="13" width="6" height="2" fill="#0a0a0a"/>
      <rect x="7" y="17" width="8" height="2" fill="#0a0a0a"/>
      <rect x="17" y="9" width="8" height="14" rx="1" fill="#0a0a0a" opacity="0.15"/>
      <circle cx="21" cy="14" r="3" fill="#0a0a0a"/>
      <rect x="19" y="18" width="4" height="5" rx="1" fill="#0a0a0a"/>
    </svg>
  );
}

function Logo({ size = 32 }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} />
      <div>
        <span className="font-black text-white tracking-tight text-base leading-none">EIC</span>
        <span className="text-neutral-500 font-medium text-base tracking-tight"> Enterprise</span>
      </div>
    </div>
  );
}

/* ─────────────────────────── NAVBAR ─────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'nav-blur border-b border-white/6' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
        <NavLink to="/" className="flex-shrink-0"><Logo /></NavLink>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500">
          <a href="#modules" className="hover:text-white transition-colors duration-200">Modules</a>
          <a href="#store" className="hover:text-white transition-colors duration-200">Store</a>
          <a href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</a>
          <a href="#testimonials" className="hover:text-white transition-colors duration-200">Reviews</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <NavLink to="/login" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors px-3 py-2">Sign in</NavLink>
          <NavLink to="/login" className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-colors shadow-[0_0_24px_rgba(255,255,255,0.15)]">
            Get started →
          </NavLink>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? <path d="M18 6L6 18M6 6l12 12"/> : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-white/6 p-6 space-y-4 anim-fade-up">
          <a href="#modules" className="block text-sm text-neutral-400 hover:text-white">Modules</a>
          <a href="#store" className="block text-sm text-neutral-400 hover:text-white">Store</a>
          <a href="#pricing" className="block text-sm text-neutral-400 hover:text-white">Pricing</a>
          <a href="#testimonials" className="block text-sm text-neutral-400 hover:text-white">Reviews</a>
          <NavLink to="/login" className="block bg-white text-black text-sm font-bold px-5 py-3 rounded-full text-center">Get started →</NavLink>
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────── HERO ─────────────────────────── */
function GridBackground() {
  return (
    <div className="absolute inset-0 grid-bg opacity-100 pointer-events-none" />
  );
}

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/[0.02] blur-3xl anim-float" style={{animationDelay:'0s'}} />
      <div className="absolute top-1/2 right-1/4 w-72 h-72 rounded-full bg-white/[0.015] blur-3xl anim-float" style={{animationDelay:'3s'}} />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-white/[0.02] blur-3xl anim-float" style={{animationDelay:'6s'}} />
    </div>
  );
}

function Hero() {
  const [videoError, setVideoError] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden pt-20">
      {/* Video background */}
      {!videoError ? (
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-[0.16] pointer-events-none"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoError(true)}
        >
          <source src="/videos/platform-preview.mp4" type="video/mp4" />
        </video>
      ) : (
        <GridBackground />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,7,0.88)_0%,rgba(5,8,7,0.72)_42%,rgba(5,8,7,0.95)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.34)_58%,rgba(0,0,0,0.72)_100%)] pointer-events-none" />
      <FloatingOrbs />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-white/[0.025] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-5xl px-6">
        {/* Badge */}
        <div className="anim-fade-up mb-10 inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] backdrop-blur px-4 py-2 rounded-full text-xs font-semibold text-neutral-400">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          East Africa's enterprise platform - 12 modules plus provider adapters
        </div>

        {/* Headline */}
        <h1 className="anim-fade-up delay-100 text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tight leading-[0.92] mb-8 drop-shadow-[0_12px_36px_rgba(0,0,0,0.75)]">
          One Platform.
          <br />
          <span className="text-neutral-500">Every System.</span>
        </h1>

        <p className="anim-fade-up delay-200 text-base md:text-xl text-neutral-200 max-w-2xl mb-12 leading-relaxed font-light drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
          Accounting, EFRIS tax records, Stripe Checkout, mobile money adapters, CRM, and ARIA intelligence - all sharing one ledger, one database, one truth.
        </p>

        <div className="anim-fade-up delay-300 flex flex-col sm:flex-row items-center gap-4">
          <NavLink to="/login" className="bg-white text-black text-sm font-bold px-8 py-4 rounded-full hover:bg-neutral-100 transition-all hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-95">
            Start for free →
          </NavLink>
          <a href="#modules" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors px-6 py-4">
            See how it works ↓
          </a>
        </div>

        {/* Stats row */}
        <div className="anim-fade-up delay-400 mt-16 grid grid-cols-3 gap-8 max-w-lg w-full">
          {[
            { n: '12+', l: 'Modules' },
            { n: 'URA', l: 'Adapter-ready' },
            { n: '3x', l: 'Faster ops' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-black text-white tracking-tight">{s.n}</div>
              <div className="text-xs text-neutral-500 mt-1 font-medium">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Hero dashboard image */}
        <div className="anim-fade-up delay-500 mt-16 w-full max-w-5xl relative">
          <div className="absolute inset-0 bg-white/[0.03] blur-3xl rounded-full scale-75 pointer-events-none" />
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(255,255,255,0.05)]">
            <img
              src="/images/hero-dashboard.png"
              alt="EIC Enterprise Dashboard"
              className="w-full object-cover anim-float"
              style={{ animationDuration: '10s' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
    </section>
  );
}

/* ─────────────────────────── CATEGORIES SECTION ─────────────────────────── */
function CategoriesSection() {
  const cats = [
    { icon: '📊', label: 'Finance', count: '3 modules', desc: 'Accounting, invoicing, payroll' },
    { icon: '🏛️', label: 'Tax', count: '6 countries', desc: 'EFRIS, KRA, TRA, FIRS' },
    { icon: '💳', label: 'Payments', count: '5 adapters', desc: 'Stripe, MoMo, M-Pesa' },
    { icon: '🤖', label: 'AI', count: 'ARIA engine', desc: 'Local + Anthropic-ready' },
    { icon: '👥', label: 'CRM', count: '284 clients', desc: 'Pipeline, lead scoring' },
    { icon: '🔐', label: 'Security', count: 'PCI DSS', desc: 'Encryption, compliance' },
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-[0.2em] mb-3">Browse by category</p>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-[-0.02em]">
              Everything you need
            </h2>
          </div>
          <a href="#modules" className="hidden sm:block text-sm font-medium text-neutral-500 hover:text-white transition-colors">
            View all modules →
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {cats.map((c, i) => (
            <div key={i} className="group bg-[#141414] border border-white/6 rounded-2xl p-5 hover:border-white/14 hover:bg-[#1a1a1a] transition-all duration-300 cursor-pointer text-center">
              <div className="text-3xl mb-3">{c.icon}</div>
              <div className="text-sm font-bold text-white mb-1">{c.label}</div>
              <div className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mb-1">{c.count}</div>
              <div className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── MODULES SECTION (Product Grid) ─────────────────────────── */
function ModulesSection() {
  const modules = [
    { icon: '📊', label: 'Smart Dashboard', desc: 'Real-time KPI cards, revenue charts, tax breakdown, live transaction ledger with method badges.', price: 'Included', badge: 'Core', features: ['KPI Cards', 'Area Charts', 'Cash Flow'] },
    { icon: '📒', label: 'ERP Accounting', desc: 'Complete double-entry ledger, P&L statements, Chart of Accounts, journal entry posting. IFRS compliant.', price: 'Included', badge: 'Core', features: ['General Ledger', 'P&L', 'IFRS Export'] },
    { icon: '🏛️', label: 'EFRIS / Tax', desc: 'URA EFRIS adapter, VAT 18% auto-compute, local e-invoices, QR/status fields, and server-side submission queue.', price: 'Included', badge: 'Essential', features: ['VAT Auto', 'Adapter Queue', '6 Countries'] },
    { icon: '📱', label: 'Pi Wallet', desc: 'Unified payment surface for MTN MoMo, Airtel Money, M-Pesa, and bank transfer adapters.', price: 'Included', badge: 'Core', features: ['MTN MoMo', 'M-Pesa', 'Bulk Pay'] },
    { icon: '🏦', label: 'Banking', desc: 'Centenary settlement readiness, bank account status labels, and reconciliation workflows without exposing credentials.', price: 'Included', badge: 'Core', features: ['Server Config', 'Transfers', 'Reconcile'] },
    { icon: '👥', label: 'CRM', desc: 'AI-powered lead scoring, visual Kanban pipeline, multi-country contact management with analytics.', price: 'Included', badge: 'Core', features: ['AI Scoring', 'Kanban', 'Analytics'] },
    { icon: '🧑‍💼', label: 'HR & Payroll', desc: 'Employee directory, leave management, PAYE/NSSF payroll processing with audit history.', price: 'Included', badge: 'New', features: ['Payroll Run', 'Leave Mgmt', 'PAYE/NSSF'] },
    { icon: '📦', label: 'Inventory', desc: 'Product catalogue, purchase orders, stock movements across multiple warehouse locations.', price: 'Included', badge: 'New', features: ['Stock Track', 'PO System', 'Multi-site'] },
    { icon: '📋', label: 'Projects', desc: 'Kanban board, task assignment, priority management, and milestone tracking for all teams.', price: 'Included', badge: 'New', features: ['Kanban', 'Milestones', 'Task Assign'] },
    { icon: '🖥️', label: 'IT Management', desc: 'Hardware/software asset register, security health scoring, license tracking, network monitoring.', price: 'Included', badge: null, features: ['Asset Tags', 'Security', 'Network'] },
    { icon: '₿', label: 'Crypto & Pi', desc: 'Live crypto rates, Pi Coin 20% discount, multi-crypto payment links, portfolio tracking.', price: 'Included', badge: null, features: ['7 Cryptos', 'Pi Coin', 'Live Rates'] },
    { icon: '🤖', label: 'ARIA — AI', desc: 'Context-aware assistant with local intelligence and Anthropic activation when the server key is configured.', price: 'Included', badge: 'Premium', features: ['Local Mode', 'Forecasts', 'Reports'] },
  ];

  return (
    <section id="modules" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-[0.2em] mb-3">12 Integrated Modules</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-[-0.03em] leading-[0.9]">
              One platform.<br /><span className="text-neutral-600">Every system.</span>
            </h2>
          </div>
          <p className="hidden md:block text-sm text-neutral-500 max-w-xs text-right">Every module shares one database. An action in one cascades across all others.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m, i) => (
            <div key={i} className="group bg-[#141414] border border-white/6 rounded-2xl overflow-hidden hover:border-white/14 transition-all duration-300">
              <div className="h-28 bg-[#0a0a0a] flex items-center justify-center relative">
                <span className="text-4xl">{m.icon}</span>
                {m.badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${m.badge === 'Core' ? 'bg-white/8 text-neutral-300 border border-white/10' : m.badge === 'Essential' ? 'bg-white text-black' : m.badge === 'New' ? 'bg-white/10 text-neutral-300 border border-white/15' : 'bg-white/5 text-neutral-400 border border-white/10'}`}>
                    {m.badge}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{m.label}</h3>
                  <span className="text-xs font-bold text-white">{m.price}</span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed mb-4">{m.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.features.map((f, fi) => (
                    <span key={fi} className="text-[10px] px-2 py-1 rounded-full bg-white/4 border border-white/6 text-neutral-400">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { from: 'CRM Deal Closed', to: 'Invoice Auto-Generated', icon: '🔗' },
            { from: 'Invoice Sent', to: 'EFRIS Adapter Queued', icon: '📄' },
            { from: 'Payment Received', to: 'Ledger Reconciled', icon: '✨' },
          ].map((flow, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#141414] border border-white/6 rounded-2xl px-5 py-4">
              <span className="text-lg">{flow.icon}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-white font-semibold">{flow.from}</span>
                <span className="text-neutral-600">→</span>
                <span className="text-neutral-400">{flow.to}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── STORE PREVIEW ─────────────────────────── */
function StorePreviewSection() {
  const addons = [
    { name: 'EFRIS Pro', price: '$29/mo', rating: '4.9', reviews: '142', cat: 'Tax', badge: 'Popular' },
    { name: 'Payroll Module', price: '$39/mo', rating: '4.7', reviews: '56', cat: 'Finance', badge: 'New' },
    { name: 'WhatsApp CRM', price: '$24/mo', rating: '4.6', reviews: '203', cat: 'Integration', badge: null },
    { name: 'ARIA Advanced', price: '$49/mo', rating: '4.9', reviews: '78', cat: 'AI', badge: 'Premium' },
  ];

  return (
    <section id="store" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-[0.2em] mb-3">Marketplace</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-[-0.03em] leading-[0.9]">
              Extend your<br /><span className="text-neutral-600">platform.</span>
            </h2>
          </div>
          <NavLink to="/login" className="hidden sm:block text-sm font-medium text-neutral-500 hover:text-white transition-colors">Browse all add-ons →</NavLink>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {addons.map((a, i) => (
            <div key={i} className="bg-[#141414] border border-white/6 rounded-2xl overflow-hidden hover:border-white/14 transition-all group">
              <div className="h-32 bg-[#0a0a0a] flex items-center justify-center relative">
                <div className="text-3xl font-black text-white/5">{a.cat}</div>
                {a.badge && (
                  <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${a.badge === 'Popular' ? 'bg-white text-black' : a.badge === 'New' ? 'bg-white/10 text-neutral-300 border border-white/15' : 'bg-white/5 text-neutral-400 border border-white/10'}`}>
                    {a.badge}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{a.name}</h3>
                  <span className="text-sm font-black text-white">{a.price}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <svg key={si} width="10" height="10" viewBox="0 0 24 24" fill={si < Math.floor(parseFloat(a.rating)) ? 'white' : 'none'} stroke={si < Math.floor(parseFloat(a.rating)) ? 'white' : '#555'} strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    <span className="text-xs text-neutral-500 ml-1">{a.rating}</span>
                  </div>
                  <span className="text-[10px] text-neutral-600">{a.reviews} reviews</span>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/4 border border-white/6 text-neutral-400">{a.cat}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── PRICING SECTION ─────────────────────────── */
function PricingSection() {
  const plans = [
    { name: 'Starter', price: '$29', period: '/mo', desc: 'For solo entrepreneurs and small teams getting started.', features: ['Dashboard + 5 modules', '3 users', '500 invoices/mo', 'Email support', 'UGX currency', 'EFRIS basic'], cta: 'Start for $29 →', popular: false },
    { name: 'Growth', price: '$99', period: '/mo', desc: 'For growing businesses that need the full platform.', features: ['All 12 modules', '15 users', 'Unlimited invoices', 'Priority support', '6 currencies', 'EFRIS compliance', 'ARIA AI basic', 'CRM pipeline', 'Payroll module'], cta: 'Get started →', popular: true },
    { name: 'Business', price: '$299', period: '/mo', desc: 'For scaling businesses with advanced needs.', features: ['All 12 modules + add-ons', '50 users', 'Unlimited everything', '24/7 chat support', '40+ currencies', 'Multi-country tax', 'ARIA Advanced', 'Custom branding', 'API access'], cta: 'Start Business →', popular: false },
    { name: 'Enterprise', price: 'Custom', period: '', desc: 'For large organizations with enterprise requirements.', features: ['Unlimited users', 'White-label option', 'Dedicated manager', 'SLA guarantee', 'Custom integrations', 'On-premise option', 'Training & onboarding'], cta: 'Contact sales →', popular: false },
  ];

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-[0.2em] mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-[-0.03em] leading-[0.9] mb-4">
            Simple, transparent<br /><span className="text-neutral-600">pricing.</span>
          </h2>
          <p className="text-neutral-500 text-lg font-light max-w-lg mx-auto">No hidden fees. Pay with Pi Coin and get 20% off any plan.</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {plans.map((p, i) => (
            <div key={i} className={`bg-[#141414] border rounded-2xl p-8 relative ${p.popular ? 'border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.06)]' : 'border-white/6'}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-white text-black px-4 py-1 rounded-full">Most Popular</div>}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">{p.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-sm text-neutral-600">{p.period}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">{p.desc}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {p.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-3 text-sm text-neutral-300">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white flex-shrink-0">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <NavLink to="/login" className={`block text-center text-sm font-bold py-3.5 rounded-xl transition-all ${p.popular ? 'bg-white text-black hover:bg-neutral-100' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'}`}>
                {p.cta}
              </NavLink>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-600">Pay with Pi Coin: <span className="text-white font-bold">20% discount</span> on all plans. All prices in USD. UGX billing available.</p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── TESTIMONIALS ─────────────────────────── */
function TestimonialsSection() {
  const reviews = [
    { name: 'David Mukasa', role: 'CEO, Kampala Tech Ltd', text: 'EIC replaced 5 separate tools for us. The EFRIS integration alone saved us 20 hours per month on tax compliance.', rating: 5, country: 'Uganda' },
    { name: 'Sarah Achieng', role: 'CFO, Safari Solutions', text: 'The accounting and payment readiness view makes it clear which providers are live, queued, or waiting on credentials.', rating: 5, country: 'Kenya' },
    { name: 'James Odhiambo', role: 'Founder, Nile Logistics', text: 'ARIA predicted a cash flow issue 3 months before it would have hit us. The AI alone is worth the subscription.', rating: 5, country: 'Uganda' },
    { name: 'Amina Hassan', role: 'COO, Dar Express', text: 'Multi-country tax compliance used to be a nightmare. EIC handles Uganda, Kenya, and Tanzania from one dashboard.', rating: 5, country: 'Tanzania' },
    { name: 'Peter Okafor', role: 'Director, Lagos Digital', text: 'The CRM-to-invoice automation saved our team countless hours. Deals close and invoices fly out automatically.', rating: 4, country: 'Nigeria' },
    { name: 'Grace Nakamya', role: 'Owner, Mango Digital', text: 'I love that everything is in one place. Banking, invoicing, tax filing — no more switching between apps.', rating: 5, country: 'Uganda' },
  ];

  return (
    <section id="testimonials" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-[0.2em] mb-3">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-[-0.03em] leading-[0.9] mb-4">
            Loved by businesses<br /><span className="text-neutral-600">across Africa.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <div key={i} className="bg-[#141414] border border-white/6 rounded-2xl p-6 hover:border-white/10 transition-all">
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, si) => (
                  <svg key={si} width="14" height="14" viewBox="0 0 24 24" fill={si < r.rating ? 'white' : 'none'} stroke={si < r.rating ? 'white' : '#555'} strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed mb-5">"{r.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-white/6">
                <div className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                  {r.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{r.name}</div>
                  <div className="text-[10px] text-neutral-500">{r.role} · {r.country}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── PARTNERS/TRUST ─────────────────────────── */
function TrustSection() {
  return (
    <section className="py-16 border-t border-b border-white/4">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs text-neutral-600 uppercase tracking-widest font-semibold mb-8">Adapter-ready for</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center">
          {['Stripe', 'MTN MoMo', 'M-Pesa', 'Flutterwave', 'Centenary Bank', 'URA EFRIS'].map((name, i) => (
            <div key={i} className="text-neutral-600 text-sm font-bold hover:text-neutral-400 transition-colors cursor-default">{name}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── NEWSLETTER ─────────────────────────── */
function NewsletterSection() {
  const [email, setEmail] = useState('');
  return (
    <section className="py-24 relative">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white tracking-[-0.02em] mb-4">Stay updated</h2>
        <p className="text-neutral-500 mb-8 font-light">Get product updates, new module announcements, and enterprise tips delivered weekly.</p>
        <div className="flex gap-3 max-w-md mx-auto">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="flex-1 bg-[#141414] border border-white/8 rounded-xl px-4 py-3.5 text-sm" />
          <button className="bg-white text-black text-sm font-bold px-6 py-3.5 rounded-xl hover:bg-neutral-100 transition-all whitespace-nowrap">Subscribe →</button>
        </div>
        <p className="text-[10px] text-neutral-700 mt-3">No spam, ever. Unsubscribe anytime.</p>
      </div>
    </section>
  );
}

/* ─────────────────────────── CTA SECTION ─────────────────────────── */
function CTASection() {
  return (
    <section className="py-24 relative">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="relative rounded-3xl border border-white/8 bg-[#141414] overflow-hidden p-16">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-white/[0.03] blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-[-0.03em] leading-[0.9] mb-6">
              Ready to unify<br />your enterprise?
            </h2>
            <p className="text-neutral-500 text-lg mb-10 font-light">
              Join enterprises across East Africa running all their systems from one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NavLink
                to="/login"
                className="bg-white text-black text-base font-bold px-10 py-4 rounded-full hover:bg-neutral-100 transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] active:scale-95"
              >
                Get started free →
              </NavLink>
              <a href="#pricing" className="text-sm font-medium text-neutral-500 hover:text-white transition-colors px-6 py-4">
                View pricing ↓
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FOOTER ─────────────────────────── */
function Footer() {
  const footerLinks = {
    'Platform': ['Dashboard', 'Accounting', 'EFRIS / Tax', 'Pi Wallet', 'Banking', 'CRM'],
    'Marketplace': ['Add-ons', 'Integrations', 'Pricing', 'Enterprise'],
    'Resources': ['Documentation', 'API Reference', 'Changelog', 'Status'],
    'Company': ['About EIC', 'Careers', 'Contact', 'Blog'],
  };

  return (
    <footer className="border-t border-white/6 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-12">
          <div className="md:col-span-1">
            <Logo size={28} />
            <p className="text-xs text-neutral-600 mt-4 leading-relaxed">
              Enterprise. Integrated. Connected. The operating system for African business.
            </p>
            <p className="text-[10px] text-neutral-700 mt-4">Settlement: configured server-side only</p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(l => (
                  <li key={l}><a href="#" className="text-xs text-neutral-600 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-700">© 2026 EIC Enterprise Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-neutral-600">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
          <p className="text-[10px] text-neutral-700">Built by <span className="text-neutral-500 font-semibold">Engola Innocent</span> · www.eic.global</p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────── LOGIN PAGE ─────────────────────────── */
function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'register'
        ? { name, email, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || (mode === 'register' ? 'Registration failed' : 'Login failed'));

      const u = data.user || { id: data.id, name: data.name, email: data.email };
      localStorage.setItem('eicToken', data.token);
      if (data.refreshToken) localStorage.setItem('eicRefreshToken', data.refreshToken);
      localStorage.setItem('eicUser', JSON.stringify(u));
      onLogin(u);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden border-r border-white/6">
        <GridBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#0a0a0a]/80" />

        <div className="relative z-10">
          <Logo size={36} />
        </div>

        <div className="relative z-10">
          <div className="mb-12">
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-[0.2em] mb-4">Trusted by enterprises</p>
            <h1 className="text-5xl font-black text-white tracking-[-0.03em] leading-[0.9] mb-6">
              The operating<br />system for<br /><span className="text-neutral-500">African business.</span>
            </h1>
            <p className="text-neutral-500 text-base font-light leading-relaxed max-w-sm">
              One login. 12 modules. Real-time compliance. Everything connected.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'IFRS-compliant accounting & ledger',
              'EFRIS / URA real-time e-receipts',
              'Stripe + MoMo/M-Pesa adapters',
              'ARIA local intelligence + Anthropic-ready',
              'CRM → Invoice → Compliance pipeline',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-neutral-400 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-neutral-700">
          © 2026 EIC Enterprise. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <Logo size={32} />
          </div>

          <div className="anim-fade-up mb-10">
            <h2 className="text-3xl font-black text-white tracking-tight mb-2">
              {mode === 'register' ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-neutral-500 text-sm">
              {mode === 'register' ? 'Join the EIC Enterprise platform' : 'Sign in to your dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="anim-fade-up delay-100 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-2">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="David Mukasa"
                  required
                  autoComplete="name"
                  className="w-full bg-[#141414] border border-white/8 rounded-xl px-4 py-3.5 text-white text-sm placeholder-neutral-700 transition-all"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full bg-[#141414] border border-white/8 rounded-xl px-4 py-3.5 text-white text-sm placeholder-neutral-700 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-widest block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="w-full bg-[#141414] border border-white/8 rounded-xl px-4 py-3.5 text-white text-sm placeholder-neutral-700 transition-all"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/8 border border-red-400/15 rounded-xl px-4 py-3 anim-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-white text-black font-bold text-sm py-3.5 rounded-xl hover:bg-neutral-100 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 60" strokeLinecap="round"/>
                  </svg>
                  {mode === 'register' ? 'Creating account…' : 'Signing in…'}
                </span>
              ) : mode === 'register' ? 'Create Account →' : 'Sign In →'}
            </button>
          </form>

          <p className="anim-fade-up delay-200 mt-6 text-xs text-neutral-600 text-center">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button onClick={toggleMode} className="text-white font-semibold hover:underline">
              {mode === 'login' ? 'Register now' : 'Sign in'}
            </button>
          </p>

          <div className="anim-fade-up delay-300 mt-10">
            <NavLink to="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              ← Back to homepage
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── DASHBOARD ─────────────────────────── */
function Sidebar({ activeSection, setActiveSection, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  const moduleItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'accounting', label: 'Accounting', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg> },
    { id: 'efris', label: 'EFRIS / Tax', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { id: 'wallet', label: 'Pi Wallet', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { id: 'banking', label: 'Banking', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: 'crm', label: 'CRM', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { id: 'hr', label: 'HR & Payroll', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id: 'inventory', label: 'Inventory', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> },
    { id: 'projects', label: 'Projects', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg> },
    { id: 'it', label: 'IT Management', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { id: 'crypto', label: 'Crypto & Pi', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg> },
    { id: 'aria', label: 'ARIA — AI', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
    { id: 'store', label: 'Marketplace', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
  ];

  const adminItems = [
    { id: 'payments', label: 'Payments', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
    { id: 'companies', label: 'Companies', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/></svg> },
    { id: 'requests', label: 'Demo Requests', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg> },
  ];

  const sidebarW = collapsed ? 60 : 240;

  return (
    <aside
      className="flex-shrink-0 bg-[#0a0a0a] border-r border-white/6 flex flex-col h-screen sticky top-0 overflow-hidden"
      style={{ width: sidebarW, transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)' }}
    >
      {/* Logo + collapse toggle */}
      <div className="p-4 border-b border-white/6 flex items-center justify-between flex-shrink-0" style={{ minHeight: 64 }}>
        {!collapsed && (
          <div className="overflow-hidden" style={{ transition: 'opacity 0.15s', opacity: collapsed ? 0 : 1 }}>
            <Logo size={24} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/8 text-neutral-500 hover:text-white transition-all flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {!collapsed && (
          <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-3 pt-2 pb-2 whitespace-nowrap">Modules</div>
        )}
        {collapsed && <div className="pt-2" />}
        {moduleItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            title={collapsed ? item.label : undefined}
            className={`sidebar-link ${activeSection === item.id ? 'active' : ''}`}
            style={collapsed ? { justifyContent: 'center', padding: '10px', gap: 0 } : {}}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
        {!collapsed && (
          <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-3 pt-4 pb-2 whitespace-nowrap">Admin</div>
        )}
        {collapsed && <div className="mt-2" />}
        {adminItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            title={collapsed ? item.label : undefined}
            className={`sidebar-link ${activeSection === item.id ? 'active' : ''}`}
            style={collapsed ? { justifyContent: 'center', padding: '10px', gap: 0 } : {}}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-white/6 flex-shrink-0">
        <div
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
          style={collapsed ? { justifyContent: 'center' } : {}}
        >
          <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user?.name || user?.email}</div>
                <div className="text-[10px] text-neutral-600 truncate">{user?.email}</div>
              </div>
              <button onClick={onLogout} title="Logout" className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-500">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <button
            onClick={onLogout}
            title="Logout"
            className="w-full flex items-center justify-center p-2 mt-1 rounded-xl hover:bg-white/5 text-neutral-500 hover:text-red-400 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}

function StatCard({ label, value, sub, icon, delay = 0 }) {
  return (
    <div className={`stat-card anim-scale-in`} style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-neutral-400">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-black text-white tracking-tight mb-1">{value}</div>
      <div className="text-sm font-semibold text-white mb-0.5">{label}</div>
      {sub && <div className="text-xs text-neutral-600">{sub}</div>}
    </div>
  );
}

function OverviewSection({ user }) {
  const [stats, setStats] = useState({ companies: '—', demoRequests: '—', payments: '—', revenue: '—' });
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eicToken');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      apiFetch('/api/companies', { headers }).then(r => r.json()).catch(() => []),
      apiFetch('/api/admin/demo-requests', { headers }).then(r => r.json()).catch(() => []),
      apiFetch('/api/stripe/payment-intents?limit=5', { headers }).then(r => r.json()).catch(() => []),
    ]).then(([companies, demoReqs, payments]) => {
      const succeeded = Array.isArray(payments) ? payments.filter(p => p.status === 'succeeded') : [];
      const totalRevenue = succeeded.reduce((sum, p) => sum + p.amount, 0) / 100;

      setStats({
        companies: Array.isArray(companies) ? companies.length : '—',
        demoRequests: Array.isArray(demoReqs) ? demoReqs.length : '—',
        payments: succeeded.length,
        revenue: Array.isArray(payments) ? `$${totalRevenue.toFixed(0)}` : '—',
      });
      setRecentPayments(Array.isArray(payments) ? payments.slice(0, 5) : []);
      setRecentRequests(Array.isArray(demoReqs) ? demoReqs.slice(0, 4) : []);
      setLoading(false);
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const formatCurrency = (amount, currency) => {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency?.toUpperCase() || 'USD' }).format(amount / 100); }
    catch { return `$${(amount / 100).toFixed(2)}`; }
  };

  const statusDot = (s) => {
    if (s === 'succeeded') return 'bg-white';
    if (s === 'processing') return 'bg-neutral-400';
    return 'bg-neutral-700';
  };

  return (
    <div className="p-8 space-y-8">
      {/* Greeting */}
      <div className="anim-fade-up">
        <h1 className="text-2xl font-black text-white tracking-tight">
          {greeting}, {user?.name || user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-neutral-500 text-sm mt-1">Here's what's happening across your platform today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Companies"
          value={loading ? '—' : stats.companies}
          sub="Registered entities"
          delay={0}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>}
        />
        <StatCard
          label="Demo Requests"
          value={loading ? '—' : stats.demoRequests}
          sub="From prospects"
          delay={0.05}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
        />
        <StatCard
          label="Successful Payments"
          value={loading ? '—' : stats.payments}
          sub="Via providers"
          delay={0.1}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
        <StatCard
          label="Revenue Processed"
          value={loading ? '—' : stats.revenue}
          sub="Total succeeded"
          delay={0.15}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
        />
      </div>

      {/* Two column: payments + requests */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="anim-fade-up delay-200 bg-[#141414] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-white">Recent Payments</h2>
            <span className="text-xs text-neutral-600">via providers</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl shimmer bg-white/3" />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">💳</div>
              <p className="text-sm text-neutral-600">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(p.status)}`} />
                    <div>
                      <div className="text-xs font-semibold text-white">{p.description || 'EIC payment'}</div>
                      <div className="text-[10px] text-neutral-600">{new Date(p.created * 1000).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-white">{formatCurrency(p.amount, p.currency)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demo Requests */}
        <div className="anim-fade-up delay-300 bg-[#141414] border border-white/6 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-white">Demo Requests</h2>
            <span className="text-xs text-neutral-600">Latest</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl shimmer bg-white/3" />
              ))}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📥</div>
              <p className="text-sm text-neutral-600">No demo requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((r, i) => (
                <div key={r.id || i} className="flex items-start gap-3 py-2 border-b border-white/4 last:border-0">
                  <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {(r.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{r.full_name}</div>
                    <div className="text-[10px] text-neutral-600 truncate">{r.company} · {r.challenge}</div>
                  </div>
                  <div className="text-[10px] text-neutral-700 flex-shrink-0">
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="anim-fade-up delay-400">
        <h2 className="text-sm font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'New Payment', desc: 'Process via adapters', id: 'payments',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
            { label: 'Add Company', desc: 'Register entity', id: 'companies',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg> },
            { label: 'Demo Requests', desc: 'View all leads', id: 'requests',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
            { label: 'View Payments', desc: 'Transaction history', id: 'payments',
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          ].map((a, i) => (
            <QuickActionCard key={i} {...a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ label, desc, id, icon }) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (id === 'payments') navigate('/payment');
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#141414] border border-white/6 rounded-2xl p-5 text-left hover:border-white/14 hover:bg-[#1a1a1a] transition-all duration-200 group w-full"
    >
      <div className="text-neutral-500 group-hover:text-white transition-colors mb-3">{icon}</div>
      <div className="text-xs font-bold text-white mb-0.5">{label}</div>
      <div className="text-[10px] text-neutral-600">{desc}</div>
    </button>
  );
}

function CompaniesSection() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', address: '', industry: '', website: '' });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('eicToken');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    apiFetch('/api/companies', { headers })
      .then(r => r.json())
      .then(d => { setCompanies(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAdding(true); setError('');
    try {
      const res = await apiFetch('/api/companies', { method: 'POST', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setCompanies(prev => [data, ...prev]);
      setForm({ name: '', address: '', industry: '', website: '' });
      setShowForm(false);
    } catch (err) { setError(err.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this company?')) return;
    await apiFetch(`/api/companies/${id}`, { method: 'DELETE', headers });
    setCompanies(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Companies</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your registered entities.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-full hover:bg-neutral-100 transition-all"
        >
          + Add Company
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="anim-scale-in bg-[#141414] border border-white/6 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white mb-4">New Company</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Company Name *', placeholder: 'Acme Corp', required: true },
              { key: 'industry', label: 'Industry', placeholder: 'Finance, Tech…' },
              { key: 'address', label: 'Address', placeholder: 'Kampala, Uganda' },
              { key: 'website', label: 'Website', placeholder: 'https://example.com' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input
                  required={f.required}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-white text-sm transition-all"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={adding} className="bg-white text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-neutral-100 transition-all disabled:opacity-50">
              {adding ? 'Saving…' : 'Save Company'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-neutral-500 hover:text-white transition-colors px-4 py-2.5">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl shimmer bg-white/3" />)}</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] border border-white/6 rounded-2xl">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-white font-bold mb-1">No companies yet</p>
          <p className="text-neutral-600 text-sm">Add your first company above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map((c, i) => (
            <div key={c.id} className="anim-fade-up flex items-center gap-4 bg-[#141414] border border-white/6 rounded-2xl p-5 hover:border-white/12 transition-all group" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                {c.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">{c.name}</div>
                <div className="text-xs text-neutral-600 mt-0.5 truncate">
                  {[c.industry, c.address].filter(Boolean).join(' · ') || 'No details'}
                </div>
              </div>
              {c.website && (
                <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-600 hover:text-white transition-colors hidden sm:block">
                  {c.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <button
                onClick={() => handleDelete(c.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-red-400 p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DemoRequestsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eicToken');
    apiFetch('/api/admin/demo-requests', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setRequests(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Demo Requests</h1>
        <p className="text-neutral-500 text-sm mt-1">Prospects interested in the platform.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer bg-white/3" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-[#141414] border border-white/6 rounded-2xl">
          <div className="text-5xl mb-4">📬</div>
          <p className="text-white font-bold mb-1">No demo requests yet</p>
          <p className="text-neutral-600 text-sm">They'll appear here when submitted via the landing page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r, i) => (
            <div key={r.id || i} className="anim-fade-up bg-[#141414] border border-white/6 rounded-2xl p-6 hover:border-white/12 transition-all" style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
                    {(r.full_name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="text-sm font-bold text-white">{r.full_name}</span>
                      <span className="text-xs text-neutral-600">·</span>
                      <span className="text-xs text-neutral-500">{r.email}</span>
                    </div>
                    <div className="text-xs text-neutral-500 mb-2">{r.company}</div>
                    <div className="inline-block text-xs bg-white/5 border border-white/8 px-3 py-1 rounded-full text-neutral-400">
                      {r.challenge}
                    </div>
                    {r.message && <p className="text-xs text-neutral-600 mt-3 leading-relaxed">{r.message}</p>}
                  </div>
                </div>
                <div className="text-xs text-neutral-700 flex-shrink-0 mt-1">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PaymentsSection() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/payment'); }, []);
  return null;
}

function AdminDashboard({ user, onLogout }) {
  const [section, setSection] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar activeSection={section} setActiveSection={setSection} user={user} onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto min-h-screen">
        {section === 'dashboard'  && <SmartDashboard user={user} />}
        {section === 'accounting' && <Accounting />}
        {section === 'efris'      && <EFRIS />}
        {section === 'wallet'     && <Wallet />}
        {section === 'banking'    && <Banking />}
        {section === 'crm'        && <CRM />}
        {section === 'hr'         && <HR />}
        {section === 'inventory'  && <Inventory />}
        {section === 'projects'   && <Projects />}
        {section === 'it'         && <ITManagement />}
        {section === 'crypto'     && <Crypto />}
        {section === 'aria'       && <ARIA />}
        {section === 'store'      && <Store />}
        {section === 'payments'   && <PaymentsSection />}
        {section === 'companies'  && <CompaniesSection />}
        {section === 'requests'   && <DemoRequestsSection />}
      </main>
    </div>
  );
}

/* ─────────────────────────── APP ─────────────────────────── */
function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('eicUser') || 'null'); }
    catch { return null; }
  });

  const navigate = useNavigate();

  const handleLogin = (u) => setUser(u);
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('eicRefreshToken');
    const token = localStorage.getItem('eicToken');
    try {
      if (token) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (_) {}
    localStorage.removeItem('eicToken');
    localStorage.removeItem('eicRefreshToken');
    localStorage.removeItem('eicUser');
    setUser(null);
    navigate('/');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="bg-[#0a0a0a] min-h-screen text-white">
            <Navbar />
            <Hero />
            <CategoriesSection />
            <ModulesSection />
            <StorePreviewSection />
            <PricingSection />
            <TrustSection />
            <TestimonialsSection />
            <NewsletterSection />
            <CTASection />
            <Footer />
          </div>
        }
      />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/admin" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
      <Route path="/payment" element={<PaymentPage />} />
    </Routes>
  );
}

export default App;
