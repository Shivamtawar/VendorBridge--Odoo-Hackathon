export default function Table({ columns, data, onRow }) {
  if (!data?.length) return (
    <div className="empty">
      <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>📭</div>
      No records found.
    </div>
  );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id ?? i} onClick={() => onRow?.(row)} className={onRow ? 'clickable' : ''}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key] ?? '—'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
