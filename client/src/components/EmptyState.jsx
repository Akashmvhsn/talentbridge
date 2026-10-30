export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {children}
    </div>
  );
}
