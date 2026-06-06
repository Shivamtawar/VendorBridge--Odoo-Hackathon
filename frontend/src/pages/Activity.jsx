import { useEffect, useState } from 'react';
import { activityAPI } from '../api';

export default function Activity() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    activityAPI.logs().then((r) => setLogs(r.data.data?.logs || r.data.data || [])).catch(() => {});
  }, []);

  return (
    <div className="page">
      <div className="page-header"><h1>Audit Logs</h1></div>
      {logs.length ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Action</th><th>User</th><th>Entity</th><th>Entity ID</th><th>Time</th></tr></thead>
            <tbody>{logs.map((l) => (
              <tr key={l.id}>
                <td><span className="action-tag">{l.action}</span></td>
                <td>{l.user_name || l.user_id?.slice(0, 8)}</td>
                <td>{l.entity_type}</td>
                <td className="text-muted">{l.entity_id?.slice(0, 8)}…</td>
                <td>{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="empty">No audit logs.</p>}
    </div>
  );
}
