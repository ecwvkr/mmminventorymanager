"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Truck, BellRing, Star, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Item } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

function daysUntil(dateStr: string) {
  return Math.floor((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("items")
      .select("*")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data) setItems(data as Item[]);
        setLoading(false);
      });
  }, []);

  const lowItems = useMemo(() => items.filter((i) => i.status === "재고 부족"), [items]);
  const shippingItems = useMemo(() => items.filter((i) => i.status === "배송중"), [items]);
  const expiringItems = useMemo(
    () =>
      items
        .filter((i) => i.expiration_date && daysUntil(i.expiration_date) <= i.expiration_alert_days)
        .sort((a, b) => daysUntil(a.expiration_date!) - daysUntil(b.expiration_date!)),
    [items]
  );

  const periodicAlerts = useMemo(() => {
    const now = Date.now();
    return items.filter((i) => {
      if (!i.is_periodic_order || !i.periodic_interval_days) return false;
      if (!i.last_ordered_date) return true;
      return (now - new Date(i.last_ordered_date).getTime()) / 86400000 >= i.periodic_interval_days;
    });
  }, [items]);

  const pinned = useMemo(() => items.filter((i) => i.is_pinned), [items]);

  if (loading) {
    return (
      <>
        <Header />
        <p className="p-4 text-sm text-muted">불러오는 중…</p>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="mx-auto max-w-3xl space-y-5 p-4">
        {/* 요약 위젯: 재고 부족 · 유통기한 임박 · 배송중 */}
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<AlertTriangle size={18} />} label="재고 부족" value={lowItems.length} tone={lowItems.length > 0 ? "low" : undefined} href="/status" />
          <Stat icon={<CalendarClock size={18} />} label="유통기한 임박" value={expiringItems.length} tone={expiringItems.length > 0 ? "shipping" : undefined} />
          <Stat icon={<Truck size={18} />} label="배송중" value={shippingItems.length} tone={shippingItems.length > 0 ? "shipping" : undefined} href="/status" />
        </div>

        {/* 주기적 발주 알림 */}
        {periodicAlerts.length > 0 && (
          <section className="rounded-xl border border-shipping/40 bg-shipping/10 p-3">
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-shipping">
              <BellRing size={16} /> 주기적 발주 알림
            </h2>
            <ul className="space-y-1.5">
              {periodicAlerts.map((i) => (
                <li key={i.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{i.name}</span>
                  <span className="font-semibold text-shipping">발주 {i.periodic_order_quantity ?? "?"}{i.unit ?? ""}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 유통기한 임박 목록 */}
        {expiringItems.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
              <CalendarClock size={16} className="text-shipping" /> 유통기한 임박
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {expiringItems.map((i) => {
                const d = daysUntil(i.expiration_date!);
                return (
                  <li key={i.id} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{i.name}</span>
                    <span className="text-xs text-muted">{i.expiration_date}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${d < 0 ? "bg-low/10 text-low" : "bg-shipping/10 text-shipping"}`}>
                      {d < 0 ? `${-d}일 지남` : d === 0 ? "오늘" : `${d}일 남음`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 즐겨찾기 */}
        <ShortcutList title="즐겨찾기" icon={<Star size={16} className="text-accent" />} items={pinned} href="/inventory" empty="즐겨찾기한 품목이 없습니다." />

        {/* 발주 필요 */}
        <ShortcutList title="발주 필요" icon={<AlertTriangle size={16} className="text-low" />} items={lowItems} href="/status" empty="재고 부족 품목이 없습니다. 👍" />

        {/* 배송중 */}
        <ShortcutList title="배송중" icon={<Truck size={16} className="text-shipping" />} items={shippingItems} href="/status" empty="배송중인 발주가 없습니다." />
      </div>
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
      <h1 className="text-lg font-bold text-foreground">대시보드</h1>
      <p className="text-xs text-muted">카페 무무무 재고 현황 한눈에</p>
    </header>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "low" | "shipping";
  href?: string;
}) {
  const toneCls = tone === "low" ? "text-low" : tone === "shipping" ? "text-shipping" : "text-primary";
  const body = (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className={`mb-1 ${toneCls}`}>{icon}</div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`text-2xl font-bold ${tone ? toneCls : "text-foreground"}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function ShortcutList({
  title,
  icon,
  items,
  href,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: Item[];
  href: string;
  empty: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          {icon} {title}
        </h2>
        {items.length > 0 && (
          <Link href={href} className="flex items-center text-xs text-muted">
            전체 <ChevronRight size={14} />
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {items.slice(0, 8).map((i) => (
            <li key={i.id}>
              <Link href={href} className="flex items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{i.name}</span>
                <span className="text-xs text-muted">
                  {i.current_stock}
                  {i.unit ?? ""}
                </span>
                <StatusBadge status={i.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
