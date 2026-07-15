"use client";

import { Minus, Plus } from "lucide-react";

// 재고 수량(또는 같은 척도의 발주/입출고 수량)을 품목의 표시 설정에 맞춰 입력.
// 묶음 모드: [묶음 개수] + [나머지] 두 칸으로 나눠 입력하고 내부적으로 base 단위로 환산.
// 개별 모드(또는 용량 미설정): base 단위 1칸.
export default function StockInput({
  capacity,
  capacityUnit,
  bundleUnit,
  mode,
  valueBase,
  onChange,
  size = "normal",
}: {
  capacity: number | null;
  capacityUnit: string | null;
  bundleUnit: string | null;
  mode: "묶음" | "개별";
  valueBase: number;
  onChange: (base: number) => void;
  size?: "normal" | "compact";
}) {
  const useBundle = mode === "묶음" && !!capacity && !!bundleUnit;
  const iconSize = size === "compact" ? 13 : 20;
  const btnCls =
    size === "compact"
      ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-foreground hover:bg-background"
      : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground hover:bg-background";
  const mainInputCls = `${size === "compact" ? "w-14 py-1.5 text-sm" : "w-20 py-2 text-xl"} rounded-lg border border-border bg-background text-center font-bold text-foreground`;

  if (!useBundle) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, valueBase - 1))} className={btnCls} aria-label="감소">
          <Minus size={iconSize} />
        </button>
        <input
          type="number"
          value={valueBase}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className={mainInputCls}
        />
        <button type="button" onClick={() => onChange(valueBase + 1)} className={btnCls} aria-label="증가">
          <Plus size={iconSize} />
        </button>
        {capacityUnit && <span className="shrink-0 text-xs text-muted">{capacityUnit}</span>}
      </div>
    );
  }

  const bundles = Math.floor(valueBase / capacity!);
  const remainder = valueBase - bundles * capacity!;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => onChange(Math.max(0, valueBase - capacity!))} className={btnCls} aria-label="묶음 감소">
        <Minus size={iconSize} />
      </button>
      <input
        type="number"
        value={bundles}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0) * capacity! + remainder)}
        className={mainInputCls}
      />
      <span className="shrink-0 text-xs text-muted">{bundleUnit}</span>
      <button type="button" onClick={() => onChange(valueBase + capacity!)} className={btnCls} aria-label="묶음 증가">
        <Plus size={iconSize} />
      </button>
      <span className="text-muted">+</span>
      <input
        type="number"
        value={remainder}
        onChange={(e) => onChange(bundles * capacity! + Math.max(0, Number(e.target.value) || 0))}
        className={`${size === "compact" ? "w-12 py-1.5 text-sm" : "w-16 py-1.5 text-sm"} rounded-lg border border-border bg-background text-center text-foreground`}
      />
      <span className="shrink-0 text-xs text-muted">{capacityUnit}</span>
    </div>
  );
}
