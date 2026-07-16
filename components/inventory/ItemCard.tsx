import Image from "next/image";
import type { Item } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { capacityLabel, formatStock } from "@/lib/format";

export default function ItemCard({ item, onClick }: { item: Item; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl border border-border bg-surface p-3 text-left transition hover:border-primary/50 hover:shadow-sm"
    >
      <div className="relative mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-background">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill sizes="(max-width: 640px) 50vw, 200px" className="object-cover" />
        ) : (
          <span className="text-3xl opacity-40">📦</span>
        )}
      </div>
      <span className="line-clamp-2 text-sm font-semibold text-foreground">{item.name}{capacityLabel(item)}</span>
      {item.tags.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {item.tags.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] text-accent">{t}</span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">{formatStock(item, item.current_stock)}</span>
        <StatusBadge status={item.status} />
      </div>
    </button>
  );
}
