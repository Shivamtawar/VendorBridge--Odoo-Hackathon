import { useEffect, useState } from 'react';
import { quotationAPI } from '../api';
import Table from '../components/Table';
import StatusBadge from '../components/StatusBadge';

export default function MyQuotations() {
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    quotationAPI.myQuotations().then((r) => setQuotations(r.data.data || []));
  }, []);

  const cols = [
    { key: 'rfq_title', label: 'RFQ', render: (r) => <span style={{fontWeight:600}}>{r.rfq_title}</span> },
    { key: 'total_amount', label: 'Amount (₹)', render: (r) => <span style={{fontWeight:700,color:'var(--brand)'}}>₹{Number(r.total_amount).toLocaleString('en-IN')}</span> },
    { key: 'delivery_days', label: 'Delivery (days)' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Submitted', render: (r) => new Date(r.created_at).toLocaleDateString('en-IN') },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>My Quotations</h1><p className="page-subtitle">{quotations.length} submitted quotation{quotations.length !== 1 ? 's' : ''}</p></div>
      </div>
      <Table columns={cols} data={quotations} />
    </div>
  );
}
