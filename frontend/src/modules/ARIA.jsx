import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api';

const suggestions = [
  'What is my total revenue this quarter?',
  'Show me overdue invoices',
  'Calculate VAT due for December',
  'Which clients have the highest lifetime value?',
  'Forecast cash flow for next 3 months',
  'Generate an invoice for Kampala Tech Ltd',
  'Show EFRIS compliance status',
  'Which payment providers are live?',
];

const contextCards = [
  { label: 'Revenue (FY 2024)', value: 'UGX 48.2M', icon: 'REV' },
  { label: 'Tax Due', value: 'UGX 4.1M', icon: 'TAX' },
  { label: 'Active Clients', value: '284', icon: 'CRM' },
  { label: 'Settlement', value: 'Server-only', icon: 'SEC' },
];

function generateLocalResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('revenue')) return 'Based on current EIC demo data, FY 2024 revenue is **UGX 48.2M**. Stripe-confirmed payments reconcile into the ledger, while adapter payments remain queued until provider credentials and callbacks are configured.';
  if (q.includes('tax') || q.includes('vat')) return '**Tax Summary - December 2024:**\n\n- VAT (18%): UGX 2,450,000, pending\n- PAYE: UGX 1,540,000, due Jan 15\n- WHT: UGX 680,000, filed\n- Income Tax: UGX 4,800,000, draft\n\nEFRIS sync uses the backend URA adapter. Missing URA credentials create a mock queued submission rather than a false live filing.';
  if (q.includes('invoice') || q.includes('overdue')) return '**Overdue Invoices:**\n\n1. INV-0035 - Nile Logistics: UGX 12,500,000\n2. INV-0031 - Mango Digital: UGX 2,100,000\n\nTotal overdue: **UGX 14,600,000**. Use CRM follow-up before generating payment links.';
  if (q.includes('client') || q.includes('customer')) return '**Top Clients by Lifetime Value:**\n\n1. Nile Logistics - UGX 62M\n2. Kampala Tech Ltd - UGX 48M\n3. Nairobi Fintech - KES 5.8M\n4. Safari Solutions - KES 3.2M';
  if (q.includes('forecast') || q.includes('cash flow')) return '**Cash Flow Forecast:**\n\nThe demo model stays positive across the next four quarters. Treat this as local intelligence until live banking, payment, and accounting feeds are configured.';
  if (q.includes('payment') || q.includes('provider') || q.includes('momo') || q.includes('airtel') || q.includes('mpesa')) return '**Payment Readiness:**\n\n- Stripe Checkout: live only when Stripe keys are configured\n- MTN MoMo, Airtel Money, M-Pesa, Flutterwave: adapter-ready with mock queueing\n- Centenary settlement: server-side configuration only\n\nNo provider secrets or bank account credentials are exposed to the frontend.';
  if (q.includes('efris') || q.includes('compliance')) return '**EFRIS Compliance Status:**\n\nUganda URA EFRIS is adapter-ready. Local invoices calculate VAT and store EFRIS status/reference fields. When credentials are missing, submissions are queued in mock mode and can be synced later.';
  return `I analyzed "${query}" using ARIA local intelligence. The platform can summarize finance, tax, payments, CRM, and operations; live model answers require ANTHROPIC_API_KEY on the server.`;
}

export default function ARIA() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm **ARIA**, EIC's intelligence layer.\n\nI can answer from the platform context and report whether provider paths are live, configured, queued, or mock. Anthropic is used only when the server has ANTHROPIC_API_KEY; otherwise I use local intelligence.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ariaStatus, setAriaStatus] = useState({ mode: 'checking', configured: false });
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    apiFetch('/api/integrations/status')
      .then(res => res.json())
      .then(data => {
        const status = data.providers?.find(provider => provider.id === 'aria');
        if (status) setAriaStatus({ mode: status.mode, configured: status.configured, message: status.message });
      })
      .catch(() => setAriaStatus({ mode: 'local', configured: false }));
  }, []);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/aria/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ARIA request failed');
      setAriaStatus({ mode: data.mode || 'local', configured: data.mode === 'anthropic', message: data.reason });
      setMessages([...newMessages, { role: 'assistant', content: data.reply || generateLocalResponse(msg) }]);
    } catch (err) {
      setAriaStatus({ mode: 'local', configured: false, message: 'Using frontend local fallback.' });
      setMessages([...newMessages, {
        role: 'assistant',
        content: generateLocalResponse(msg)
      }]);
    }

    setLoading(false);
  };

  const renderInline = (text, baseKey) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, j) =>
      j % 2 === 1
        ? <strong key={`${baseKey}-${j}`} className="text-white font-bold">{part}</strong>
        : <span key={`${baseKey}-${j}`}>{part}</span>
    );
  };

  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1">
        {lines.map((line, i) => {
          if (line.trim() === '') return <div key={i} className="h-1" />;
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const content = line.replace(/^[-*]\s/, '');
            return <div key={i} className="flex gap-2 text-sm"><span className="text-neutral-500 flex-shrink-0">-</span><span>{renderInline(content, i)}</span></div>;
          }
          const olMatch = line.match(/^(\d+)\.\s(.*)/);
          if (olMatch) {
            return <div key={i} className="flex gap-2 text-sm"><span className="text-neutral-500 flex-shrink-0">{olMatch[1]}.</span><span>{renderInline(olMatch[2], i)}</span></div>;
          }
          if (line.startsWith('#')) return <div key={i} className="text-sm font-bold text-white mt-1">{renderInline(line.replace(/^#+\s*/, ''), i)}</div>;
          if (line.startsWith('|')) return <div key={i} className="font-mono text-xs text-neutral-400">{line}</div>;
          return <div key={i} className="text-sm">{renderInline(line, i)}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="p-8 flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">ARIA - AI Intelligence</h1>
          <p className="text-neutral-500 text-sm mt-1">Context-aware finance assistant with Anthropic integration gated by server credentials.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
          <span className={`w-2 h-2 rounded-full ${ariaStatus.configured ? 'bg-emerald-300' : 'bg-amber-300'} animate-pulse`} />
          <span className="text-xs text-neutral-400">Mode: {ariaStatus.mode}</span>
        </div>
      </div>

      {ariaStatus.message && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-xs text-neutral-300">
          {ariaStatus.message}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {contextCards.map((c, i) => (
          <div key={i} className="bg-[#141414] border border-white/6 rounded-xl p-3">
            <div className="text-[10px] font-black text-neutral-600 mb-1">{c.icon}</div>
            <div className="text-xs text-neutral-500">{c.label}</div>
            <div className="text-sm font-bold text-white">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-[#141414] border border-white/6 rounded-2xl flex flex-col overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-white text-black rounded-br-md' : 'bg-white/5 border border-white/6 text-neutral-200 rounded-bl-md'}`}>
                {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/6 rounded-2xl rounded-bl-md px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-white/6">
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestions.slice(0, 4).map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)} className="text-xs bg-white/5 border border-white/8 rounded-full px-3 py-1.5 text-neutral-400 hover:text-white hover:border-white/20 transition-all">
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask ARIA about finance, tax, payments, CRM, or provider readiness..."
              className="flex-1 bg-[#0a0a0a] border border-white/8 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-all"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-neutral-100 transition-all disabled:opacity-30"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
