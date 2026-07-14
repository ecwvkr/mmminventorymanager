"use client";

import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import type { Item } from "@/lib/types";
import { capacityLabel } from "@/lib/format";

export type ChangeType = "입고" | "출고" | "실사";

const TYPES: { t: ChangeType; label: string; hint: string }[] = [
  { t: "입고", label: "입고 [+]", hint: "현재 재고에 더함" },
  { t: "출고", label: "출고 [−]", hint: "현재 재고에서 뺌" },
  { t: "실사", label: "실사 [=]", hint: "실제 수량으로 확정" },
];

export default function StepperModal({
  item,
  onClose,
  onAdd,
  onDeactivate,
}: {
  item: Item;
  onClose: () => void;
  onAdd: (type: ChangeType, qty: number) => void;
  onDeactivate: () => void;
}) {
  const [type, setType] = useState<ChangeType | null>(null);
  const [qty, setQty] = useState(1);

  const canAdd = type !== null && qty > 0;
  const previewNew =
    type === "입고"
      ? item.current_stock + qty
      : type === "출고"
        ? Math.max(item.current_stock - qty, 0)
        : type === "실사"
          ? qty
          : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-surface p-5 pb-8 sm:rounded-2xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">{item.name}{capacityLabel(item)}</h2>
            <p className="text-xs text-muted">
              현재 재고 {item.current_stock}
              {item.unit ?? ""} · {item.category ?? "미분류"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-background" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* 변동 타입 (담기 전 반드시 선택) */}
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map(({ t, label }) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg border px-2 py-2.5 text-sm font-semibold transition ${
                type === t
                  ? "border-primary bg-primary text-primary-ink"
                  : "border-border bg-background text-foreground hover:border-primary/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1 h-4 text-center text-[11px] text-muted">
          {type ? TYPES.find((x) => x.t === type)!.hint : "변동 타입을 선택하세요"}
        </p>

        {/* 수량 스테퍼 */}
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            onClick={() => setQty((n) => Math.max(1, n - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground hover:bg-background"
            aria-label="감소"
          >
            <Minus size={20} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-lg border border-border bg-background py-2 text-center text-xl font-bold text-foreground"
          />
          <button
            onClick={() => setQty((n) => n + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground hover:bg-background"
            aria-label="증가"
          >
            <Plus size={20} />
          </button>
        </div>

        {previewNew !== null && (
          <p className="mt-3 text-center text-sm text-muted">
            반영 후 재고: <span className="font-bold text-foreground">{previewNew}{item.unit ?? ""}</span>
          </p>
        )}

        <button
          disabled={!canAdd}
          onClick={() => canAdd && onAdd(type!, qty)}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-ink transition disabled:opacity-40"
        >
          장바구니 담기
        </button>

        <button
          onClick={onDeactivate}
          className="mt-3 w-full text-center text-xs text-inactive underline underline-offset-2"
        >
          이 품목 비활성화
        </button>
      </div>
    </div>
  );
}
