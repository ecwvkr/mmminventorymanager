export default function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition ${
        active ? "bg-primary text-primary-ink" : "bg-surface text-muted hover:text-foreground border border-border"
      }`}
    >
      {children}
    </button>
  );
}
