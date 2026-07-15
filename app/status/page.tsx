"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageCheck, Truck, Search, Trash2, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOperator } from "@/lib/operator";
import type { Item, ItemStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ItemDetailModal from "@/components/ItemDetailModal";
import Chip from "@/components/Chip";
import StockInput from "@/components/StockInput";
import { capacityLabel, formatStock } from "@/lib/format";

type Tab = "전체" | "발주";
type StatusFilter = "전체" | ItemStatus;
type SortKey = "이름" | "재고적은순" | "가격높은순";

const STATUS_FILTERS: StatusFilter[] = ["전체", "정상", "재고 부족", "배송중", "비활성화"];

interface OrderCartLine {
  item: Item;
  qty: number;
}

// 발주는 항상 구매 단위(판/박스=capacity)로만 가능하므로 부족분을 그 배수로 올림.
// 예: 계란 22개 부족 + 1판=30개 → 1판(30개) 제안
function defaultOrderQty(it: Item) {
  const raw = it.periodic_order_quantity ?? Math.max(it.min_required_stock - it.current_stock, 1);
  return it.capacity ? Math.ceil(raw / it.capacity) * it.capacity : raw;
}

export default function StatusPage() {
  return (
    <Suspense fallback={null}>
      <StatusPageInner />
    </Suspense>
  );
}

function StatusPageInner() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("전체");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [sortKey, setSortKey] = useState<SortKey>("이름");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);

  const [orderCart, setOrderCart] = useState<OrderCartLine[]>([]);
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderErr, setOrderErr] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const addedFromQuery = useRef(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("items").select("*").order("name");
    if (data) setItems(data as Item[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  // 대시보드 "발주하기"에서 넘어온 경우: 발주 탭으로 전환 + 해당 품목 자동으로 담기
  useEffect(() => {
    if (searchParams.get("tab") === "발주") setTab("발주");

    if (addedFromQuery.current || items.length === 0) return;
    const addId = searchParams.get("add");
    if (!addId) return;
    const target = items.find((i) => i.id === addId);
    if (target) {
      setOrderCart((cart) =>
        cart.some((c) => c.item.id === target.id) ? cart : [...cart, { item: target, qty: defaultOrderQty(target) }]
      );
      addedFromQuery.current = true;
    }
  }, [items, searchParams]);

  // ── 전체 탭 ──
  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[],
    [items]
  );
  const tableRows = useMemo(() => {
    let rows = items.filter(
      (i) =>
        (statusFilter === "전체" || i.status === statusFilter) &&
        (!catFilter || i.category === catFilter) &&
        (!q || i.name.toLowerCase().includes(q.toLowerCase()) || i.tags.some((t) => t.includes(q)))
    );
    rows = [...rows].sort((a, b) => {
      if (sortKey === "재고적은순") return a.current_stock - b.current_stock;
      if (sortKey === "가격높은순") return b.price - a.price;
      return a.name.localeCompare(b.name, "ko");
    });
    return rows;
  }, [items, statusFilter, catFilter, q, sortKey]);

  // ── 발주 탭 ──
  const lowStockItems = useMemo(() => items.filter((i) => i.status === "재고 부족"), [items]);
  const shipping = useMemo(() => items.filter((i) => i.status === "배송중"), [items]);

  function orderNow(it: Item) {
    if (it.order_url) {
      window.open(it.order_url, "_blank", "noopener,noreferrer");
    } else if (it.order_contact) {
      window.location.href = `tel:${it.order_contact}`;
    }
    setOrderCart((cart) =>
      cart.some((c) => c.item.id === it.id) ? cart : [...cart, { item: it, qty: defaultOrderQty(it) }]
    );
  }
  function updateCartQty(itemId: string, qty: number) {
    setOrderCart((cart) => cart.map((c) => (c.item.id === itemId ? { ...c, qty: Math.max(0, qty) } : c)));
  }
  function removeCartLine(itemId: string) {
    setOrderCart((cart) => cart.filter((c) => c.item.id !== itemId));
  }
  async function completeOrders() {
    if (orderCart.length === 0) return;
    setOrderBusy(true);
    setOrderErr(null);
    const operator = getOperator();
    for (const line of orderCart) {
      const { error } = await supabase.rpc("mark_ordered", {
        p_item_id: line.item.id,
        p_quantity: line.qty,
        p_operator: operator,
      });
      if (error) {
        setOrderBusy(false);
        setOrderErr(`${line.item.name}: ${error.message}`);
        return;
      }
    }
    setOrderBusy(false);
    setOrderCart([]);
    load();
  }

  async function receiveOrder(it: Item) {
    setBusy(it.id);
    await supabase.rpc("receive_order", { p_item_id: it.id, p_operator: getOperator() });
    setBusy(null);
    load();
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-foreground">재고현황</h1>
        <div className="mt-2 flex gap-1 rounded-lg bg-surface p-1">
          {(["전체", "발주"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition ${
                tab === t ? "bg-primary text-primary-ink" : "text-muted"
              }`}
            >
              {t === "발주" ? "발주" : "전체 목록"}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-4">
        {loading ? (
          <p className="text-sm text-muted">불러오는 중…</p>
        ) : tab === "전체" ? (
          <TableView
            rows={tableRows}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortKey={sortKey}
            setSortKey={setSortKey}
            onSelect={setEditing}
            q={q}
            setQ={setQ}
            categories={categories}
            catFilter={catFilter}
            setCatFilter={setCatFilter}
          />
        ) : (
          <OrderView
            items={lowStockItems}
            shipping={shipping}
            orderCart={orderCart}
            orderBusy={orderBusy}
            orderErr={orderErr}
            onOrderNow={orderNow}
            onUpdateCartQty={updateCartQty}
            onRemoveCartLine={removeCartLine}
            onCompleteOrders={completeOrders}
            busy={busy}
            receiveOrder={receiveOrder}
          />
        )}
      </div>

      {editing && (
        <ItemDetailModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </>
  );
}

// ────────────────────────────── 전체 목록 ──────────────────────────────
function TableView({
  rows,
  statusFilter,
  setStatusFilter,
  sortKey,
  setSortKey,
  onSelect,
  q,
  setQ,
  categories,
  catFilter,
  setCatFilter,
}: {
  rows: Item[];
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  sortKey: SortKey;
  setSortKey: (s: SortKey) => void;
  onSelect: (item: Item) => void;
  q: string;
  setQ: (v: string) => void;
  categories: string[];
  catFilter: string | null;
  setCatFilter: (c: string | null) => void;
}) {
  return (
    <>
      {/* 검색 */}
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <Search size={16} className="text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="품목명·태그 검색"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={catFilter === null} onClick={() => setCatFilter(null)}>
          전체
        </Chip>
        {categories.map((c) => (
          <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                statusFilter === s ? "bg-primary text-primary-ink" : "border border-border text-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="shrink-0 rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground"
        >
          <option value="이름">이름순</option>
          <option value="재고적은순">재고 적은순</option>
          <option value="가격높은순">가격 높은순</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted">해당 품목이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {rows.map((it) => (
            <li key={it.id}>
              <button onClick={() => onSelect(it)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-background/50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{it.name}{capacityLabel(it)}</p>
                  <p className="text-xs text-muted">
                    {it.vendor_name || "거래처 미지정"} · {it.price.toLocaleString()}원
                  </p>
                </div>
                <div className="text-right text-xs text-muted">
                  <span className="font-semibold text-foreground">{formatStock(it, it.current_stock)}</span>
                  <span className="text-muted"> / 최소 {formatStock(it, it.min_required_stock)}</span>
                </div>
                <StatusBadge status={it.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// ────────────────────────────── 발주 ──────────────────────────────
function OrderView({
  items,
  shipping,
  orderCart,
  orderBusy,
  orderErr,
  onOrderNow,
  onUpdateCartQty,
  onRemoveCartLine,
  onCompleteOrders,
  busy,
  receiveOrder,
}: {
  items: Item[];
  shipping: Item[];
  orderCart: OrderCartLine[];
  orderBusy: boolean;
  orderErr: string | null;
  onOrderNow: (it: Item) => void;
  onUpdateCartQty: (itemId: string, qty: number) => void;
  onRemoveCartLine: (itemId: string) => void;
  onCompleteOrders: () => void;
  busy: string | null;
  receiveOrder: (it: Item) => void;
}) {
  const [vendorFilter, setVendorFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const vendors = useMemo(() => Array.from(new Set(items.map((i) => i.vendor_name || "거래처 미지정"))), [items]);
  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[],
    [items]
  );
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (!vendorFilter || (i.vendor_name || "거래처 미지정") === vendorFilter) &&
          (!categoryFilter || i.category === categoryFilter)
      ),
    [items, vendorFilter, categoryFilter]
  );

  return (
    <div className="space-y-5">
      {/* 발주 리스트 (담아둔 품목) */}
      <section className="rounded-xl border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <ShoppingBag size={16} /> 발주 리스트
          </h2>
          <span className="text-xs text-muted">{orderCart.length}건</span>
        </div>
        {orderCart.length === 0 ? (
          <p className="text-xs text-muted">담긴 품목이 없습니다. 아래 목록에서 ‘발주하기’를 눌러 담으세요.</p>
        ) : (
          <ul className="space-y-2">
            {orderCart.map((line) => (
              <li key={line.item.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {line.item.name}{capacityLabel(line.item)}
                </span>
                <StockInput
                  capacity={line.item.capacity}
                  capacityUnit={line.item.capacity_unit}
                  bundleUnit={line.item.unit}
                  mode={line.item.stock_display_mode}
                  valueBase={line.qty}
                  onChange={(v) => onUpdateCartQty(line.item.id, v)}
                  size="compact"
                />
                <button
                  onClick={() => onRemoveCartLine(line.item.id)}
                  className="shrink-0 rounded p-1 text-muted hover:text-low"
                  aria-label="삭제"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {orderErr && <p className="mt-2 rounded-lg bg-low/10 p-2 text-xs text-low">{orderErr}</p>}
        <button
          disabled={orderCart.length === 0 || orderBusy}
          onClick={onCompleteOrders}
          className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-ink disabled:opacity-40"
        >
          {orderBusy ? "처리 중…" : `발주 완료 (${orderCart.length}건)`}
        </button>
      </section>

      {/* 발주 필요 목록 */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-foreground">발주 필요</h2>

        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          <Chip active={vendorFilter === null} onClick={() => setVendorFilter(null)}>전체 거래처</Chip>
          {vendors.map((v) => (
            <Chip key={v} active={vendorFilter === v} onClick={() => setVendorFilter(v)}>{v}</Chip>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            <Chip active={categoryFilter === null} onClick={() => setCategoryFilter(null)}>전체 카테고리</Chip>
            {categories.map((c) => (
              <Chip key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>{c}</Chip>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
            {items.length === 0 ? "재고 부족 품목이 없습니다. 👍" : "조건에 맞는 품목이 없습니다."}
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {filtered.map((it) => {
              const inCart = orderCart.some((c) => c.item.id === it.id);
              return (
                <li key={it.id} className="flex items-center gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{it.name}{capacityLabel(it)}</p>
                    <p className="text-xs text-muted">
                      {it.vendor_name || "거래처 미지정"} · 현재 {formatStock(it, it.current_stock)} / 최소 {formatStock(it, it.min_required_stock)}
                    </p>
                  </div>
                  {inCart ? (
                    <span className="shrink-0 rounded-lg border border-primary/40 px-2.5 py-1.5 text-xs font-semibold text-primary">
                      담김 ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => onOrderNow(it)}
                      className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-ink"
                    >
                      발주하기
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 배송중 → 입고 확인 */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Truck size={16} className="text-shipping" /> 배송중 ({shipping.length})
        </h2>
        {shipping.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">배송중인 발주가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {shipping.map((it) => (
              <li key={it.id} className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{it.name}{capacityLabel(it)}</p>
                  <p className="text-xs text-muted">
                    발주 수량 {it.pending_order_quantity != null ? formatStock(it, it.pending_order_quantity) : "?"}
                    {" · "}{it.vendor_name || "거래처 미지정"}
                  </p>
                </div>
                <button
                  disabled={busy === it.id}
                  onClick={() => receiveOrder(it)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-ok px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  <PackageCheck size={14} /> 입고 확인
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
