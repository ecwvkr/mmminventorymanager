"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, AlertTriangle, Wallet, BellRing, Star, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Item } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

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

  const stats = useMemo(() => {
    const lowCount = items.filter((i) => i.status === "재고 부족").length;
    const totalValue = items.reduce((s, i) => s + i.current_stock * i.price, 0);
    return { total: items.length, lowCount, totalValue };
  }, [items]);

  const categoryValues = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of items) {
      const k = i.category || "미분류";
      map.set(k, (map.get(k) ?? 0) + i.current_stock * i.price);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);
  const maxCatValue = categoryValues[0]?.[1] || 1;

  const periodicAlerts = useMemo(() => {
    const now = Date.now();
    return items.filter((i) => {
      if (!i.is_periodic_order || !i.periodic_interval_days) return false;
      if (!i.last_ordered_date) return true; // 주기발주인데 한 번도 발주 안 함
      const days = (now - new Date(i.last_ordered_date).getTime()) / 86400000;
      return days >= i.periodic_interval_days;
    });
  }, [items]);

  const pinned = useMemo(() => items.filter((i) => i.is_pinned), [items]);
  const lowItems = useMemo(() => items.filter((i) => i.status === "재고 부족"), [items]);

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
        {/* 요약 위젯 */}
        <div className="grid grid-cols-3 gap-3">
          <Stat icon={<Boxes size={18} />} label="전체 품목" value={`${stats.total}`} />
          <Stat icon={<AlertTriangle size={18} />} label="재고 부족" value={`${stats.lowCount}`} tone={stats.lowCount > 0 ? "low" : undefined} />
          <Stat icon={<Wallet size={18} />} label="재고 자산" value={`${Math.round(stats.totalValue).toLocaleString()}원`} small />
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

        {/* 카테고리별 자산 분포 */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">카테고리별 재고 자산</h2>
          {categoryValues.length === 0 ? (
            <p className="text-xs text-muted">데이터가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {categoryValues.map(([cat, val]) => (
                <li key={cat}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span className="text-foreground">{cat}</span>
                    <span className="text-muted">{Math.round(val).toLocaleString()}원</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(val / maxCatValue) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 바로가기: 즐겨찾기 */}
        <ShortcutList
          title="즐겨찾기"
          icon={<Star size={16} className="text-accent" />}
          items={pinned}
          href="/inventory"
          empty="즐겨찾기한 품목이 없습니다."
        />

        {/* 바로가기: 발주 필요 */}
        <ShortcutList
          title="발주 필요"
          icon={<AlertTriangle size={16} className="text-low" />}
          items={lowItems}
          href="/status"
          empty="재고 부족 품목이 없습니다. 👍"
        />
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
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "low";
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className={`mb-1 ${tone === "low" ? "text-low" : "text-primary"}`}>{icon}</div>
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`font-bold text-foreground ${small ? "text-sm" : "text-xl"} ${tone === "low" ? "text-low" : ""}`}>{value}</p>
    </div>
  );
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
