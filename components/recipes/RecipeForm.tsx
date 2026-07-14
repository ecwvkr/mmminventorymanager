"use client";

import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import type { Item, RecipeWithDetail } from "@/lib/types";
import { inputCls } from "@/components/ItemForm";

export interface RecipeIngredientInput {
  item_id: string;
  quantity: string; // 입력 중 상태라 문자열로 관리
}

export interface RecipePayload {
  name: string;
  output_item_id: string;
  output_quantity: number;
  memo: string | null;
  ingredients: { item_id: string; quantity: number }[];
}

export default function RecipeForm({
  initial,
  items,
  saving,
  error,
  onSubmit,
}: {
  initial?: RecipeWithDetail | null;
  items: Item[];
  saving: boolean;
  error: string | null;
  onSubmit: (payload: RecipePayload) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [outputItemId, setOutputItemId] = useState(initial?.output_item_id ?? "");
  const [outputQty, setOutputQty] = useState(String(initial?.output_quantity ?? 1));
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>(
    initial?.recipe_ingredients.map((ri) => ({ item_id: ri.item_id, quantity: String(ri.quantity) })) ?? [
      { item_id: "", quantity: "" },
    ]
  );
  const [localErr, setLocalErr] = useState<string | null>(null);

  function updateIngredient(i: number, patch: Partial<RecipeIngredientInput>) {
    setIngredients((list) => list.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function addIngredient() {
    setIngredients((list) => [...list, { item_id: "", quantity: "" }]);
  }
  function removeIngredient(i: number) {
    setIngredients((list) => list.filter((_, idx) => idx !== i));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalErr(null);
    const validRows = ingredients.filter((r) => r.item_id && Number(r.quantity) > 0);
    if (!name.trim()) return setLocalErr("레시피 이름을 입력하세요.");
    if (!outputItemId) return setLocalErr("결과물 품목을 선택하세요.");
    if (validRows.length === 0) return setLocalErr("재료를 1개 이상 추가하세요.");

    onSubmit({
      name: name.trim(),
      output_item_id: outputItemId,
      output_quantity: Number(outputQty) || 1,
      memo: memo.trim() || null,
      ingredients: validRows.map((r) => ({ item_id: r.item_id, quantity: Number(r.quantity) })),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="레시피 이름 *">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="예: 바스크 치즈케이크" />
      </Field>

      <div className="rounded-xl border border-border bg-surface p-3">
        <p className="mb-2 text-xs font-semibold text-muted">결과물</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="품목">
            <select value={outputItemId} onChange={(e) => setOutputItemId(e.target.value)} className={inputCls}>
              <option value="">선택하세요</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
          </Field>
          <Field label="기본 산출 수량">
            <input type="number" value={outputQty} onChange={(e) => setOutputQty(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <p className="mt-1 text-[11px] text-muted">결과물 품목이 목록에 없다면 재고등록에서 먼저 등록하세요.</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-muted">재료 (소모 품목)</p>
          <button type="button" onClick={addIngredient} className="flex items-center gap-1 text-xs font-medium text-primary">
            <Plus size={14} /> 재료 추가
          </button>
        </div>
        <div className="space-y-2">
          {ingredients.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <ItemPicker
                items={items}
                value={row.item_id}
                onChange={(id) => updateIngredient(i, { item_id: id })}
              />
              <div className="w-20 shrink-0">
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) => updateIngredient(i, { quantity: e.target.value })}
                  placeholder="수량"
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="shrink-0 rounded-lg p-2 text-muted hover:text-low"
                aria-label="삭제"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Field label="메모">
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} className={inputCls} placeholder="비고" />
      </Field>

      {(localErr || error) && <p className="rounded-lg bg-low/10 p-2 text-sm text-low">{localErr || error}</p>}

      <button type="submit" disabled={saving} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-ink disabled:opacity-40">
        {saving ? "저장 중…" : "레시피 저장"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

// 검색해서 고르는 품목 선택 콤보박스. 네이티브 select는 옵션 텍스트가 길면
// 고정폭 형제 요소(수량 입력)와의 비율이 깨지는 문제가 있어 텍스트 입력 기반으로 대체.
function ItemPicker({
  items,
  value,
  onChange,
}: {
  items: Item[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = items.find((it) => it.id === value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = items.filter((it) => it.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="relative min-w-0 flex-[3]">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={open ? query : (selected?.name ?? "")}
          onFocus={() => { setQuery(""); setOpen(true); }}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="품목 검색"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
        />
      </div>
      {open && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-xs text-muted">검색 결과 없음</li>
          ) : (
            filtered.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onChange(it.id); setOpen(false); }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-background ${
                    it.id === value ? "bg-primary/10 font-semibold text-primary" : "text-foreground"
                  }`}
                >
                  {it.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
