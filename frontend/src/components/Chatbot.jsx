import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../api';

const TOPICS = [
  { key: 'summary',        label: 'Summary',        icon: '📊' },
  { key: 'rfq',           label: 'RFQs',            icon: '📋' },
  { key: 'vendor',        label: 'Vendors',          icon: '🏢' },
  { key: 'quotation',     label: 'Quotations',       icon: '💬' },
  { key: 'purchase_order',label: 'Purchase Orders',  icon: '📦' },
  { key: 'invoice',       label: 'Invoices',         icon: '🧾' },
];

function Msg({ role, content }) {
  return (
    <div className={`chat-msg chat-msg-${role}`}>
      <div className="chat-bubble">{content}</div>
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
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const selectTopic = async (t) => {
    setTopic(t);
    setSelectedId(null);
    setSelectedLabel('');
    setHistory([]);
    setItems([]);

    if (t.key === 'summary') return;

    setLoadingItems(true);
    chatAPI.items(t.key)
      .then((r) => setItems(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingItems(false));
  };

  const selectItem = (item) => {
    const label = item.title || item.company_name || item.po_number || item.invoice_number || item.vendor || item.id;
    setSelectedId(item.id);
    setSelectedLabel(label);
    setHistory([{
      role: 'assistant',
      content: `Loaded data for **${label}**. Ask me anything about it — status, amounts, vendors, timeline, etc.`,
    }]);
  };

  const send = async (e) => {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;

    const newHistory = [...history, { role: 'user', content: msg }];
    setHistory(newHistory);
    setInput('');
    setLoading(true);

    try {
      const r = await chatAPI.send({
        message: msg,
        history: history,
        topic: topic?.key,
        selectedId: selectedId || undefined,
      });
      setHistory([...newHistory, { role: 'assistant', content: r.data.data.reply }]);
    } catch {
      setHistory([...newHistory, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setTopic(null); setSelectedId(null); setSelectedLabel(''); setHistory([]); setItems([]); };

  const itemDisplayName = (item) =>
    item.title || item.company_name || item.po_number || item.invoice_number || item.rfq || '';

  const itemMeta = (item) => {
    if (item.status) return item.status;
    if (item.price) return `₹${Number(item.price).toLocaleString('en-IN')}`;
    if (item.total_amount) return `₹${Number(item.total_amount).toLocaleString('en-IN')}`;
    if (item.total) return `₹${Number(item.total).toLocaleString('en-IN')}`;
    return '';
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} title="VendorBridge Assistant">
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-left">
              {topic && (
                <button className="chat-back" onClick={reset} title="Back">←</button>
              )}
              <span>
                {!topic ? 'VendorBridge Assistant' : selectedLabel ? `${topic.icon} ${selectedLabel}` : `${topic.icon} ${topic.label}`}
              </span>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-body">
            {/* Step 1 — pick topic */}
            {!topic && (
              <div className="chat-topics">
                <p className="chat-hint">What would you like help with?</p>
                {TOPICS.map((t) => (
                  <button key={t.key} className="chat-topic-btn" onClick={() => selectTopic(t)}>
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — pick item (not for summary) */}
            {topic && topic.key !== 'summary' && !selectedId && (
              <div className="chat-items">
                <p className="chat-hint">Select a {topic.label.slice(0, -1).toLowerCase()}:</p>
                {loadingItems ? (
                  <div className="chat-loading">Loading…</div>
                ) : items.length ? items.map((item) => (
                  <button key={item.id} className="chat-item-btn" onClick={() => selectItem(item)}>
                    <span className="chat-item-name">{itemDisplayName(item)}</span>
                    {itemMeta(item) && <span className="chat-item-meta">{itemMeta(item)}</span>}
                  </button>
                )) : <p className="chat-empty">No records found.</p>}
              </div>
            )}

            {/* Step 3 — chat */}
            {(selectedId || topic?.key === 'summary') && (
              <div className="chat-messages">
                {topic?.key === 'summary' && history.length === 0 && (
                  <Msg role="assistant" content="I have the system summary loaded. Ask me about RFQ stats, spend, vendors, pending approvals, or anything else!" />
                )}
                {history.map((m, i) => <Msg key={i} role={m.role} content={m.content} />)}
                {loading && (
                  <div className="chat-msg chat-msg-assistant">
                    <div className="chat-bubble chat-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {(selectedId || topic?.key === 'summary') && (
            <form className="chat-input-row" onSubmit={send}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                disabled={loading}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !input.trim()}>
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
