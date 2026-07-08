import type { ItemStatus } from "@/lib/types";

const MAP: Record<ItemStatus, string> = {
  "정상": "bg-ok/10 text-ok",
  "재고 부족": "bg-low/10 text-low",
  "배송중": "bg-shipping/10 text-shipping",
  "비활성화": "bg-inactive/10 text-inactive",
};

export default function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${MAP[status]}`}>
      {status}
    </span>
  );
}
