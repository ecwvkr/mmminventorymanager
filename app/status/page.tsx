"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Phone, PackageCheck, Truck, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOperator } from "@/lib/operator";
import type { Item, ItemStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import ItemDetailModal from "@/components/ItemDetailModal";

type Tab = "전체" | "발주";
type StatusFilter = "전체" | ItemStatus;
type SortKey = "이름" | "재고적은순" | "가격높은순";

const STATUS_FILTERS: StatusFilter[] = ["전체", "정상", "재고 부족", "배송중", "비활성화"];

export default function StatusPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("전체");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [sortKey, setSortKey] = useState<SortKey>("이름");
  const [orderQty, setOrderQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("items").select("*").order("name");
    if (data) setItems(data as Item[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  // ── 전체 탭 ──
  const tableRows = useMemo(() => {
    let rows = items.filter((i) => statusFilter === "전체" || i.status === statusFilter);
    rows = [...rows].sort((a, b) => {
      if (sortKey === "재고적은순") return a.current_stock - b.current_stock;
      if (sortKey === "가격높은순") return b.price - a.price;
      return a.name.localeCompare(b.name, "ko");
    });
    return rows;
  }, [items, statusFilter, sortKey]);

  // ── 발주 탭: 재고 부족 → 거래처별 그룹 ──
  const vendorGroups = useMemo(() => {
    const low = items.filter((i) => i.status === "재고 부족");
    const map = new Map<string, Item[]>();
    for (const it of low) {
      const key = it.vendor_name || "거래처 미지정";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return [...map.entries()];
  }, [items]);

  const shipping = useMemo(() => items.filter((i) => i.status === "배송중"), [items]);

  function qtyFor(it: Item) {
    return orderQty[it.id] ?? it.periodic_order_quantity ?? Math.max(it.min_required_stock - it.current_stock, 1);
  }

  async function markOrdered(it: Item) {
    setBusy(it.id);
    await supabase.rpc("mark_ordered", { p_item_id: it.id, p_quantity: qtyFor(it), p_operator: getOperator() });
    setBusy(null);
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
              {t === "발주" ? "거래처별 발주" : "전체 목록"}
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
          />
        ) : (
          <OrderView
            vendorGroups={vendorGroups}
            shipping={shipping}
            qtyFor={qtyFor}
            setOrderQty={setOrderQty}
            markOrdered={markOrdered}
            receiveOrder={receiveOrder}
            busy={busy}
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
}: {
  rows: Item[];
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  sortKey: SortKey;
  setSortKey: (s: SortKey) => void;
  onSelect: (item: Item) => void;
}) {
  return (
    <>
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
                  <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                  <p className="text-xs text-muted">
                    {it.vendor_name || "거래처 미지정"} · {it.price.toLocaleString()}원
                  </p>
                </div>
                <div className="text-right text-xs text-muted">
                  <span className="font-semibold text-foreground">
                    {it.current_stock}
                    {it.unit ?? ""}
                  </span>
                  <span className="text-muted"> / 최소 {it.min_required_stock}</span>
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

// ────────────────────────────── 거래처별 발주 ──────────────────────────────
function OrderView({
  vendorGroups,
  shipping,
  qtyFor,
  setOrderQty,
  markOrdered,
  receiveOrder,
  busy,
}: {
  vendorGroups: [string, Item[]][];
  shipping: Item[];
  qtyFor: (it: Item) => number;
  setOrderQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  markOrdered: (it: Item) => void;
  receiveOrder: (it: Item) => void;
  busy: string | null;
}) {
  return (
    <div className="space-y-5">
      {/* 발주 필요 */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-foreground">발주 필요 (거래처별)</h2>
        {vendorGroups.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">재고 부족 품목이 없습니다. 👍</p>
        ) : (
          <div className="space-y-3">
            {vendorGroups.map(([vendor, list]) => {
              const url = list.find((i) => i.order_url)?.order_url;
              const contact = list.find((i) => i.order_contact)?.order_contact;
              return (
                <div key={vendor} className="overflow-hidden rounded-xl border border-border bg-surface">
                  <div className="flex items-center justify-between gap-2 border-b border-border bg-background/50 px-3 py-2">
                    <span className="truncate text-sm font-semibold text-foreground">{vendor}</span>
                    <div className="flex shrink-0 gap-1.5">
                      {url && (
                        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground">
                          <ExternalLink size={13} /> 웹샵
                        </a>
                      )}
                      {contact && (
                        <a href={`tel:${contact}`} className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-foreground">
                          <Phone size={13} /> 전화
                        </a>
                      )}
                    </div>
                  </div>
                  <ul className="divide-y divide-border">
                    {list.map((it) => (
                      <li key={it.id} className="flex items-center gap-2 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                          <p className="text-xs text-muted">
                            현재 {it.current_stock}
                            {it.unit ?? ""} / 최소 {it.min_required_stock}
                          </p>
                        </div>
                        <input
                          type="number"
                          value={qtyFor(it)}
                          onChange={(e) => setOrderQty((m) => ({ ...m, [it.id]: Math.max(1, Number(e.target.value) || 1) }))}
                          className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm text-foreground"
                          aria-label="발주 수량"
                        />
                        <button
                          disabled={busy === it.id}
                          onClick={() => markOrdered(it)}
                          className="shrink-0 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-ink disabled:opacity-40"
                        >
                          발주 완료
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
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
                  <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                  <p className="text-xs text-muted">
                    발주 수량 {it.pending_order_quantity ?? "?"}
                    {it.unit ?? ""} · {it.vendor_name || "거래처 미지정"}
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
