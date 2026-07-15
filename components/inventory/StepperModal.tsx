"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Item } from "@/lib/types";
import { capacityLabel, formatStock } from "@/lib/format";
import StockInput from "@/components/StockInput";

export type ChangeType = "입고" | "출고" | "실사";

const TYPES: { t: ChangeType; label: string; hint: string }[] = [
  { t: "입고", label: "입고 [+]", hint: "현재 재고에 더함" },
  { t: "출고", label: "출고 [−]", hint: "현재 재고에서 뺌" },
  { t: "실사", label: "실사 [=]", hint: "실제 수량으로 확정" },
];

// 타입 선택 시 시작 수량: 실사는 현재 재고값을 프리필.
// 입고는 표시 모드와 무관하게 항상 1묶음이 기본값 — 배송은 늘 구매 단위(판/박스)로 오기 때문.
// 출고는 묶음 모드일 때만 1묶음(낱개 소비도 흔해서 개별 모드에선 1개가 더 자연스러움).
export function defaultQty(type: ChangeType, item: Item): number {
  if (type === "실사") return item.current_stock;
  if (item.capacity && (type === "입고" || item.stock_display_mode === "묶음")) return item.capacity;
  return 1;
}

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

  function selectType(t: ChangeType) {
    setType(t);
    setQty(defaultQty(t, item));
  }

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
              현재 재고 {formatStock(item, item.current_stock)} · {item.category ?? "미분류"}
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
              onClick={() => selectType(t)}
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

        {/* 수량 입력 */}
        <div className="mt-3 flex items-center justify-center">
          <StockInput
            capacity={item.capacity}
            capacityUnit={item.capacity_unit}
            bundleUnit={item.unit}
            mode={item.stock_display_mode}
            valueBase={qty}
            onChange={setQty}
          />
        </div>

        {previewNew !== null && (
          <p className="mt-3 text-center text-sm text-muted">
            반영 후 재고: <span className="font-bold text-foreground">{formatStock(item, previewNew)}</span>
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
