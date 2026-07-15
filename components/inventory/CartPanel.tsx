"use client";

import { Trash2 } from "lucide-react";
import type { Item } from "@/lib/types";
import type { ChangeType } from "./StepperModal";
import { capacityLabel, formatStock } from "@/lib/format";

export interface CartLine {
  item: Item;
  type: ChangeType;
  qty: number;
}

const SIGN: Record<ChangeType, string> = { "입고": "+", "출고": "−", "실사": "=" };
const TONE: Record<ChangeType, string> = {
  "입고": "text-ok",
  "출고": "text-low",
  "실사": "text-shipping",
};

export default function CartPanel({
  lines,
  applying,
  error,
  onRemove,
  onApply,
  onCancel,
}: {
  lines: CartLine[];
  applying: boolean;
  error: string | null;
  onRemove: (index: number) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold text-foreground">장바구니</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">{lines.length}건</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {lines.length === 0 ? (
          <p className="mt-8 text-center text-xs text-muted">담긴 변경 사항이 없습니다.<br />품목을 눌러 추가하세요.</p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{l.item.name}{capacityLabel(l.item)}</p>
                  <p className="text-xs text-muted">
                    <span className={`font-bold ${TONE[l.type]}`}>{l.type} {SIGN[l.type]}</span>
                    {formatStock(l.item, l.qty)}
                  </p>
                </div>
                <button onClick={() => onRemove(i)} className="rounded p-1 text-muted hover:text-low" aria-label="삭제">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-3 rounded-lg bg-low/10 p-2 text-xs text-low">{error}</p>}
      </div>

      <div className="border-t border-border p-4">
        <button
          disabled={lines.length === 0 || applying}
          onClick={onApply}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-ink transition disabled:opacity-40"
        >
          {applying ? "반영 중…" : `적용 (${lines.length}건 일괄 반영)`}
        </button>
        <button
          disabled={lines.length === 0 || applying}
          onClick={onCancel}
          className="mt-2 w-full rounded-xl py-2 text-sm font-medium text-muted transition hover:text-foreground disabled:opacity-40"
        >
          취소 (비우기)
        </button>
      </div>
    </div>
  );
}
