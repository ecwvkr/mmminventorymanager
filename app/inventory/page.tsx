"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, X, ChefHat, ScanLine } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOperator } from "@/lib/operator";
import type { Item } from "@/lib/types";
import ItemCard from "@/components/inventory/ItemCard";
import StepperModal, { type ChangeType } from "@/components/inventory/StepperModal";
import CartPanel, { type CartLine } from "@/components/inventory/CartPanel";
import ScanCartModal from "@/components/inventory/ScanCartModal";
import Chip from "@/components/Chip";

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<Item | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [applying, setApplying] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) setErr(error.message);
    else setItems(data as Item[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[],
    [items]
  );
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (!cat || i.category === cat) &&
          (!q ||
            i.name.toLowerCase().includes(q.toLowerCase()) ||
            i.tags.some((t) => t.includes(q)))
      ),
    [items, cat, q]
  );

  function addToCart(type: ChangeType, qty: number) {
    if (!selected) return;
    setCart((c) => [...c, { item: selected, type, qty }]);
    setSelected(null);
  }

  async function deactivate() {
    if (!selected) return;
    const op = getOperator();
    await supabase.from("items").update({ is_active: false }).eq("id", selected.id);
    await supabase.from("inventory_logs").insert({
      item_id: selected.id,
      action_type: "상태변경",
      previous_quantity: selected.current_stock,
      change_quantity: 0,
      new_quantity: selected.current_stock,
      changed_by: op,
    });
    setSelected(null);
    load();
  }

  async function apply() {
    if (cart.length === 0) return;
    setApplying(true);
    setErr(null);
    const p_changes = cart.map((l) => ({
      item_id: l.item.id,
      action_type: l.type,
      quantity: l.qty,
    }));
    const { error } = await supabase.rpc("apply_inventory_changes", {
      p_changes,
      p_operator: getOperator(),
    });
    setApplying(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setCart([]);
    setCartOpen(false);
    load();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">재고관리</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setScanOpen(true)}
              className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground"
            >
              <ScanLine size={16} /> 스캔
            </button>
            <Link href="/recipes" className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground">
              <ChefHat size={16} /> 레시피
            </Link>
            {/* 모바일 장바구니 열기 */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-full p-2 text-primary lg:hidden"
              aria-label="장바구니"
            >
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-low px-1 text-[10px] font-bold text-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* 검색 */}
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <Search size={16} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="품목명·태그 검색"
            className="w-full rounded bg-transparent text-sm text-foreground outline-none focus:ring-2 focus:ring-primary placeholder:text-muted"
          />
        </div>
        {/* 카테고리 가로 스크롤 바 */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          <Chip active={cat === null} onClick={() => setCat(null)}>
            전체
          </Chip>
          {categories.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </header>

      <div className="flex">
        {/* 좌: 물품 카드 */}
        <div className="flex-1 p-3">
          {loading ? (
            <p className="p-4 text-sm text-muted">불러오는 중…</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted">표시할 품목이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((item) => (
                <ItemCard key={item.id} item={item} onClick={() => setSelected(item)} />
              ))}
            </div>
          )}
        </div>

        {/* 우: 장바구니 (lg 이상 고정 패널) */}
        <aside className="sticky top-[132px] hidden h-[calc(100vh-132px-5rem)] w-80 shrink-0 border-l border-border bg-surface lg:block">
          <CartPanel
            lines={cart}
            applying={applying}
            error={err}
            onRemove={(i) => setCart((c) => c.filter((_, idx) => idx !== i))}
            onApply={apply}
            onCancel={() => setCart([])}
          />
        </aside>
      </div>

      {/* 스테퍼 모달 */}
      {selected && (
        <StepperModal
          item={selected}
          onClose={() => setSelected(null)}
          onAdd={addToCart}
          onDeactivate={deactivate}
        />
      )}

      {/* 모바일 장바구니 드로어 */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 lg:hidden" onClick={() => setCartOpen(false)}>
          <div className="flex w-80 max-w-[85%] flex-col bg-surface" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCartOpen(false)}
              className="self-end p-3 text-muted"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
            <div className="min-h-0 flex-1">
              <CartPanel
                lines={cart}
                applying={applying}
                error={err}
                onRemove={(i) => setCart((c) => c.filter((_, idx) => idx !== i))}
                onApply={apply}
                onCancel={() => setCart([])}
              />
            </div>
          </div>
        </div>
      )}

      {/* 바코드/QR 스캔 → 장바구니 담기 (입고 시 여러 품목 연속 스캔용) */}
      {scanOpen && (
        <ScanCartModal
          items={items}
          cartCount={cart.length}
          onAdd={(line) => setCart((c) => [...c, line])}
          onClose={() => setScanOpen(false)}
        />
      )}
    </>
  );
}
