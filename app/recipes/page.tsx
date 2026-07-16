"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, ChefHat } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Item, RecipeWithDetail } from "@/lib/types";
import RecipeForm, { type RecipePayload } from "@/components/recipes/RecipeForm";
import ExecuteRecipeModal from "@/components/recipes/ExecuteRecipeModal";
import { baseUnitLabel } from "@/lib/format";
import { useEscapeKey } from "@/lib/useEscapeKey";

const ITEM_FIELDS = "id,name,unit,current_stock,capacity,capacity_unit,stock_display_mode";
const RECIPE_SELECT =
  `*, output_item:items!output_item_id(${ITEM_FIELDS}), recipe_ingredients(id,recipe_id,item_id,quantity,item:items!item_id(${ITEM_FIELDS}))`;

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeWithDetail[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RecipeWithDetail | "new" | null>(null);
  const [executing, setExecuting] = useState<RecipeWithDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEscapeKey(() => setEditing(null));

  async function load() {
    setLoading(true);
    const [{ data: r }, { data: i }] = await Promise.all([
      supabase.from("recipes").select(RECIPE_SELECT).order("name"),
      supabase.from("items").select("*").eq("is_active", true).order("name"),
    ]);
    if (r) setRecipes(r as unknown as RecipeWithDetail[]);
    if (i) setItems(i as Item[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveRecipe(payload: RecipePayload) {
    setSaving(true);
    setErr(null);
    const isNew = editing === "new";
    const recipeId = isNew ? undefined : (editing as RecipeWithDetail).id;

    if (isNew) {
      const { data, error } = await supabase
        .from("recipes")
        .insert({ name: payload.name, output_item_id: payload.output_item_id, output_quantity: payload.output_quantity, memo: payload.memo })
        .select("id")
        .single();
      if (error) { setSaving(false); setErr(error.message); return; }
      const { error: ingErr } = await supabase
        .from("recipe_ingredients")
        .insert(payload.ingredients.map((ing) => ({ recipe_id: data!.id, item_id: ing.item_id, quantity: ing.quantity })));
      if (ingErr) { setSaving(false); setErr(ingErr.message); return; }
    } else {
      const { error } = await supabase
        .from("recipes")
        .update({ name: payload.name, output_item_id: payload.output_item_id, output_quantity: payload.output_quantity, memo: payload.memo })
        .eq("id", recipeId);
      if (error) { setSaving(false); setErr(error.message); return; }
      // 기존 재료 전부 교체 (단순·확실한 방식)
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
      const { error: ingErr } = await supabase
        .from("recipe_ingredients")
        .insert(payload.ingredients.map((ing) => ({ recipe_id: recipeId, item_id: ing.item_id, quantity: ing.quantity })));
      if (ingErr) { setSaving(false); setErr(ingErr.message); return; }
    }

    setSaving(false);
    setEditing(null);
    load();
  }

  async function deleteRecipe(r: RecipeWithDetail) {
    if (!confirm(`'${r.name}' 레시피를 삭제할까요?`)) return;
    await supabase.from("recipes").delete().eq("id", r.id);
    load();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link href="/inventory" className="text-muted" aria-label="뒤로">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">레시피</h1>
            <p className="text-xs text-muted">제조(원재료 출고 + 결과물 입고)</p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-ink"
          >
            <Plus size={16} /> 새 레시피
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 p-4">
        {loading ? (
          <p className="text-sm text-muted">불러오는 중…</p>
        ) : recipes.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">등록된 레시피가 없습니다. 새 레시피를 추가하세요.</p>
        ) : (
          recipes.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-foreground">{r.name}</h3>
                  <p className="text-xs text-muted">
                    → {r.output_item?.name ?? "?"} {r.output_quantity}{r.output_item ? baseUnitLabel(r.output_item) : ""} · 재료 {r.recipe_ingredients.length}종
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => setEditing(r)} className="rounded-lg p-1.5 text-muted hover:text-foreground" aria-label="수정">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteRecipe(r)} className="rounded-lg p-1.5 text-muted hover:text-low" aria-label="삭제">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setExecuting(r)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-ink"
              >
                <ChefHat size={16} /> 제조 실행
              </button>
            </div>
          ))
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 sm:p-4" onClick={() => setEditing(null)}>
          <div className="min-h-full w-full max-w-xl bg-background sm:min-h-0 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
              <h2 className="text-base font-bold text-foreground">{editing === "new" ? "새 레시피" : "레시피 수정"}</h2>
            </header>
            <div className="p-4">
              <RecipeForm
                initial={editing === "new" ? null : editing}
                items={items}
                saving={saving}
                error={err}
                onSubmit={saveRecipe}
              />
            </div>
          </div>
        </div>
      )}

      {executing && (
        <ExecuteRecipeModal
          recipe={executing}
          onClose={() => setExecuting(null)}
          onDone={() => {
            setExecuting(null);
            load();
          }}
        />
      )}
    </>
  );
}
