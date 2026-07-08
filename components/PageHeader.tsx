export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
    </header>
  );
}
