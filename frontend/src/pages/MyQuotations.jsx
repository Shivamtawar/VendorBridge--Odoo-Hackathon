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
    { key: 'rfq_title', label: 'RFQ' },
    { key: 'total_amount', label: 'Amount (₹)', render: (r) => `₹${Number(r.total_amount).toLocaleString('en-IN')}` },
    { key: 'delivery_days', label: 'Delivery (days)' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Submitted', render: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <div className="page">
      <div className="page-header"><h1>My Quotations</h1></div>
      <Table columns={cols} data={quotations} />
    </div>
  );
}
