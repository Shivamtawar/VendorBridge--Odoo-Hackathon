export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 680 } : {}} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}