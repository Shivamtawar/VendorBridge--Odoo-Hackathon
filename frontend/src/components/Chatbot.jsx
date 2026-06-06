import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../api';

const TOPICS = [
  { key: 'summary',         label: 'Overview',        icon: '◈', desc: 'System-wide stats & summary' },
  { key: 'rfq',            label: 'RFQs',             icon: '≡', desc: 'Request for Quotations' },
  { key: 'vendor',         label: 'Vendors',           icon: '⌂', desc: 'Vendor profiles & history' },
  { key: 'quotation',      label: 'Quotations',        icon: '◻', desc: 'Vendor quotes & bids' },
  { key: 'purchase_order', label: 'Purchase Orders',   icon: '▣', desc: 'POs & delivery status' },
  { key: 'invoice',        label: 'Invoices',          icon: '▤', desc: 'Billing & payments' },
];

// Minimal markdown → HTML: bold, bullets, line breaks
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^[\s]*[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^(?!<[uop]|<li)(.+)/, '<p>$1')
    .replace(/([^>])$/, '$1</p>');
}

function Bubble({ role, content }) {
  return (
    <div className={`chat-msg chat-msg-${role}`}>
      {role === 'assistant' && (
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginRight: 6, alignSelf: 'flex-end' }}>
          V
        </div>
      )}
      <div
        className="chat-bubble"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </div>
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  useEffect(() => {
    if ((selectedId || topic?.key === 'summary') && open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [selectedId, topic, open]);

  const selectTopic = async (t) => {
    setTopic(t); setSelectedId(null); setSelectedLabel(''); setHistory([]); setItems([]); setError('');
    if (t.key === 'summary') {
      setHistory([{ role: 'assistant', content: "I have the full system summary loaded. Ask me about active RFQs, pending approvals, total spend, top vendors, or anything else!" }]);
      return;
    }
    setLoadingItems(true);
    try {
      const r = await chatAPI.items(t.key);
      setItems(r.data.data || []);
    } catch { setError('Could not load items. Check your connection.'); }
    finally { setLoadingItems(false); }
  };

  const selectItem = (item) => {
    const label = item.title || item.company_name || item.po_number || item.invoice_number || item.vendor || item.id;
    setSelectedId(item.id);
    setSelectedLabel(label);
    setError('');
    setHistory([{
      role: 'assistant',
      content: `I've loaded all data for **${label}**. Ask me anything — status, amounts, timeline, vendor details, linked POs, invoices, or anything else!`,
    }]);
  };

  const send = async (e) => {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;
    setError('');
    const newHistory = [...history, { role: 'user', content: msg }];
    setHistory(newHistory);
    setInput('');
    setLoading(true);
    try {
      const r = await chatAPI.send({ message: msg, history, topic: topic?.key, selectedId: selectedId || undefined });
      setHistory([...newHistory, { role: 'assistant', content: r.data.data.reply }]);
    } catch (ex) {
      const msg = ex.response?.data?.message || '';
      if (msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('gemini')) {
        setError('Gemini API key not configured. Add GEMINI_API_KEY to backend/.env');
      } else {
        setHistory([...newHistory, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
      }
    } finally { setLoading(false); }
  };

  const reset = () => { setTopic(null); setSelectedId(null); setSelectedLabel(''); setHistory([]); setItems([]); setError(''); };

  const itemDisplayName = (item) => item.title || item.company_name || item.po_number || item.invoice_number || item.rfq || item.id;
  const itemMeta = (item) => {
    if (item.status) return item.status;
    if (item.price) return `₹${Number(item.price).toLocaleString('en-IN')}`;
    if (item.total_amount) return `₹${Number(item.total_amount).toLocaleString('en-IN')}`;
    if (item.total) return `₹${Number(item.total).toLocaleString('en-IN')}`;
    return '';
  };

  const inChat = selectedId || topic?.key === 'summary';

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} title="VendorBridge Assistant">
        {open ? '✕' : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              {topic && <button className="chat-back" onClick={reset}>←</button>}
              <div>
                <div className="chat-header-title">
                  {!topic ? 'VendorBridge Assistant' : selectedLabel ? `${topic.icon} ${selectedLabel}` : `${topic.icon} ${topic.label}`}
                </div>
                {!topic && <div className="chat-header-sub">Powered by Gemini AI</div>}
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Body */}
          <div className="chat-body">

            {/* Step 1 — topic picker */}
            {!topic && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p className="chat-hint">What would you like to explore?</p>
                {TOPICS.map((t) => (
                  <button key={t.key} className="chat-topic-btn" onClick={() => selectTopic(t)}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{t.desc}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 14 }}>›</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — item picker */}
            {topic && topic.key !== 'summary' && !selectedId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p className="chat-hint">Select a {topic.label.replace(/s$/, '').toLowerCase()} to ask about:</p>
                {error && <div className="chat-error">{error}</div>}
                {loadingItems ? (
                  <div className="chat-loading">Loading {topic.label.toLowerCase()}…</div>
                ) : items.length ? items.map((item) => (
                  <button key={item.id} className="chat-item-btn" onClick={() => selectItem(item)}>
                    <span className="chat-item-name">{itemDisplayName(item)}</span>
                    {itemMeta(item) && <span className="chat-item-meta">{itemMeta(item)}</span>}
                  </button>
                )) : <p className="chat-empty">No {topic.label.toLowerCase()} found.</p>}
              </div>
            )}

            {/* Step 3 — chat messages */}
            {inChat && (
              <div className="chat-messages">
                {history.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
                {loading && (
                  <div className="chat-msg chat-msg-assistant">
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginRight: 6, alignSelf: 'flex-end' }}>V</div>
                    <div className="chat-bubble chat-typing"><span /><span /><span /></div>
                  </div>
                )}
                {error && <div className="chat-error" style={{ marginTop: 4 }}>{error}</div>}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Suggested prompts when chat first opens */}
          {inChat && history.length <= 1 && !loading && (
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(topic?.key === 'summary'
                ? ['Pending approvals?', 'Total spend this month?', 'Active RFQs?']
                : topic?.key === 'rfq'
                ? ['What is the status?', 'Which vendors quoted?', 'Any POs raised?']
                : topic?.key === 'vendor'
                ? ['Quotation history?', 'Any open POs?', 'Performance summary?']
                : topic?.key === 'quotation'
                ? ['Was this approved?', 'Compare to others?', 'Any PO created?']
                : topic?.key === 'purchase_order'
                ? ['Delivery status?', 'Invoice raised?', 'Total amount?']
                : ['Payment status?', 'Linked PO?', 'Due date?']
              ).map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-2)', whiteSpace: 'nowrap' }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {inChat && (
            <form className="chat-input-row" onSubmit={send}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !input.trim()}>
                {loading ? '…' : '↑'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
