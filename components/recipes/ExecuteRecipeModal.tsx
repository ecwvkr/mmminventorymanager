"use client";

import { useState } from "react";
import { X, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOperator } from "@/lib/operator";
import type { RecipeWithDetail } from "@/lib/types";

export default function ExecuteRecipeModal({
  recipe,
  onClose,
  onDone,
}: {
  recipe: RecipeWithDetail;
  onClose: () => void;
  onDone: () => void;
}) {
  const [qtys, setQtys] = useState<Record<string, string>>(
    Object.fromEntries(recipe.recipe_ingredients.map((ri) => [ri.item_id, String(ri.quantity)]))
  );
  const [outputQty, setOutputQty] = useState(String(recipe.output_quantity));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function confirm() {
    setErr(null);
    const ingredients = recipe.recipe_ingredients.map((ri) => ({
      item_id: ri.item_id,
      quantity: Number(qtys[ri.item_id]) || 0,
    }));
    if (ingredients.some((i) => i.quantity <= 0)) {
      setErr("모든 재료 수량은 0보다 커야 합니다.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.rpc("execute_recipe", {
      p_recipe_id: recipe.id,
      p_ingredients: ingredients,
      p_output_quantity: Number(outputQty) || 0,
      p_operator: getOperator(),
    });
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-5 pb-8 sm:rounded-2xl sm:pb-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">제조 실행 · {recipe.name}</h2>
            <p className="text-xs text-muted">이번 제조에만 적용할 수량을 조정할 수 있습니다.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-background" aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <p className="mb-2 text-xs font-semibold text-muted">소모 재료 (출고)</p>
        <div className="space-y-2">
          {recipe.recipe_ingredients.map((ri) => {
            const qty = Number(qtys[ri.item_id]) || 0;
            const stock = ri.item?.current_stock ?? 0;
            const over = qty > stock;
            return (
              <div key={ri.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{ri.item?.name ?? "(삭제된 품목)"}</p>
                  <p className="text-xs text-muted">
                    현재 {stock}{ri.item?.unit ?? ""}
                    {over && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-low">
                        <TriangleAlert size={11} /> 재고 초과
                      </span>
                    )}
                  </p>
                </div>
                <input
                  type="number"
                  value={qtys[ri.item_id]}
                  onChange={(e) => setQtys((m) => ({ ...m, [ri.item_id]: e.target.value }))}
                  className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm text-foreground"
                />
              </div>
            );
          })}
        </div>

        <p className="mb-2 mt-4 text-xs font-semibold text-muted">결과물 (입고)</p>
        <div className="flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/10 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{recipe.output_item?.name ?? "(삭제된 품목)"}</p>
            <p className="text-xs text-muted">현재 {recipe.output_item?.current_stock ?? 0}{recipe.output_item?.unit ?? ""}</p>
          </div>
          <input
            type="number"
            value={outputQty}
            onChange={(e) => setOutputQty(e.target.value)}
            className="w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-center text-sm text-foreground"
          />
        </div>

        {err && <p className="mt-3 rounded-lg bg-low/10 p-2 text-xs text-low">{err}</p>}

        <button
          disabled={saving}
          onClick={confirm}
          className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-ink disabled:opacity-40"
        >
          {saving ? "처리 중…" : "제조 확정 (출고+입고 반영)"}
        </button>
      </div>
    </div>
  );
}
