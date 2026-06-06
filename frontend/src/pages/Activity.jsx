import { useEffect, useState } from 'react';
import { activityAPI } from '../api';

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    activityAPI.logs().then((r) => setLogs(r.data.data?.logs || r.data.data || [])).catch(() => {});
  }, []);

  const filtered = filter ? logs.filter(l => l.action?.toLowerCase().includes(filter.toLowerCase()) || l.entity_type?.toLowerCase().includes(filter.toLowerCase())) : logs;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="page-subtitle">{logs.length} activity record{logs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="filter-bar" style={{marginBottom:18}}>
        <input style={{maxWidth:280}} placeholder="Filter by action or entity…" value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      {filtered.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Action</th><th>User</th><th>Entity</th><th>Entity ID</th><th>Time</th></tr></thead>
            <tbody>{filtered.map((l) => (
              <tr key={l.id}>
                <td><span className="action-tag">{l.action}</span></td>
                <td style={{fontWeight:500}}>{l.user_name || l.user_id?.slice(0, 8)}</td>
                <td style={{color:'var(--text-2)'}}>{l.entity_type}</td>
                <td><code style={{fontSize:11,background:'var(--surface-2)',padding:'2px 6px',borderRadius:4,color:'var(--muted)'}}>{l.entity_id?.slice(0, 8)}…</code></td>
                <td style={{color:'var(--muted)',fontSize:12}}>{new Date(l.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="empty">No audit logs found.</p>}
    </div>
  );
}
