import type { Item } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl border border-border bg-surface p-3 text-left transition hover:border-primary/50 hover:shadow-sm"
    >
      <div className="mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-background">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl opacity-40">📦</span>
        )}
      </div>
      <span className="line-clamp-2 text-sm font-semibold text-foreground">{item.name}</span>
      {item.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] text-accent">{t}</span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          {item.current_stock}
          {item.unit ?? ""}
        </span>
        <StatusBadge status={item.status} />
      </div>
    </button>
  );
}
