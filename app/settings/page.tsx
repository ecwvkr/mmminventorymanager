"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  RefreshCw,
  PlusCircle,
  Download,
  Cloud,
  UserRound,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOperator, setOperator } from "@/lib/operator";
import { downloadCsv } from "@/lib/csv";
import type { ActionType, InventoryLog } from "@/lib/types";

type LogRow = InventoryLog & { items: { name: string } | null };
type ActionFilter = "전체" | ActionType;

const ACTION_FILTERS: ActionFilter[] = ["전체", "입고", "출고", "실사", "상태변경", "등록"];

const ACTION_ICON: Record<ActionType, React.ReactNode> = {
  "입고": <ArrowDownToLine size={15} className="text-ok" />,
  "출고": <ArrowUpFromLine size={15} className="text-low" />,
  "실사": <ClipboardCheck size={15} className="text-shipping" />,
  "상태변경": <RefreshCw size={15} className="text-muted" />,
  "등록": <PlusCircle size={15} className="text-primary" />,
};

export default function SettingsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [filter, setFilter] = useState<ActionFilter>("전체");
  const [operator, setOp] = useState("");
  const [savedOp, setSavedOp] = useState("");
  const [assets, setAssets] = useState<{ category: string; value: number }[]>([]);
  const [totalAsset, setTotalAsset] = useState(0);

  useEffect(() => {
    setOp(getOperator());
    setSavedOp(getOperator());
    supabase
      .from("inventory_logs")
      .select("*, items(name)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => data && setLogs(data as LogRow[]));

    supabase
      .from("items")
      .select("category, current_stock, price")
      .eq("is_active", true)
      .then(({ data }) => {
        if (!data) return;
        const map = new Map<string, number>();
        let total = 0;
        for (const i of data) {
          const v = (i.current_stock as number) * (i.price as number);
          total += v;
          const k = (i.category as string) || "미분류";
          map.set(k, (map.get(k) ?? 0) + v);
        }
        setAssets([...map.entries()].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value));
        setTotalAsset(total);
      });
  }, []);

  const maxAsset = useMemo(() => assets[0]?.value || 1, [assets]);

  const shown = logs.filter((l) => filter === "전체" || l.action_type === filter);

  function saveOperator() {
    setOperator(operator.trim() || "직원");
    setSavedOp(operator.trim() || "직원");
  }

  async function exportItems() {
    const { data } = await supabase.from("items").select("*").order("name");
    if (!data) return;
    downloadCsv(
      `재고현황_${today()}.csv`,
      ["품목명", "카테고리", "현재재고", "단위", "최소보유", "가격", "상태", "거래처", "유통기한", "바코드"],
      data.map((i) => [
        i.name, i.category, i.current_stock, i.unit, i.min_required_stock, i.price, i.status, i.vendor_name, i.expiration_date, i.barcode,
      ])
    );
  }

  async function exportLogs() {
    const { data } = await supabase
      .from("inventory_logs")
      .select("*, items(name)")
      .order("created_at", { ascending: false });
    if (!data) return;
    downloadCsv(
      `재고이력_${today()}.csv`,
      ["일시", "품목명", "변동타입", "이전수량", "변동수량", "이후수량", "작업자"],
      (data as LogRow[]).map((l) => [
        fmt(l.created_at), l.items?.name ?? "(삭제된 품목)", l.action_type, l.previous_quantity, l.change_quantity, l.new_quantity, l.changed_by,
      ])
    );
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-foreground">설정</h1>
        <p className="text-xs text-muted">이력 · 백업 · 작업자</p>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 p-4">
        {/* 현재 작업자 */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
            <UserRound size={16} /> 현재 작업자
          </h2>
          <p className="mb-2 text-xs text-muted">재고 변경 이력에 이 이름이 기록됩니다. (공용 태블릿 모드)</p>
          <div className="flex gap-2">
            <input
              value={operator}
              onChange={(e) => setOp(e.target.value)}
              placeholder="작업자 이름"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <button onClick={saveOperator} className="shrink-0 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-ink">
              저장
            </button>
          </div>
          <p className="mt-1.5 text-xs text-muted">현재: <span className="font-semibold text-foreground">{savedOp}</span></p>
        </section>

        {/* 백업 */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-bold text-foreground">백업</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={exportItems} className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground">
              <Download size={15} /> 재고현황 CSV
            </button>
            <button onClick={exportLogs} className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground">
              <Download size={15} /> 이력 CSV
            </button>
          </div>
          <button
            disabled
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted"
          >
            <Cloud size={15} /> 구글 드라이브 자동 백업 (연결 예정)
          </button>
        </section>

        {/* 카테고리별 재고 자산 */}
        <section className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <BarChart3 size={16} /> 카테고리별 재고 자산
            </h2>
            <span className="text-xs text-muted">총 {Math.round(totalAsset).toLocaleString()}원</span>
          </div>
          {assets.length === 0 ? (
            <p className="text-xs text-muted">데이터가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {assets.map(({ category, value }) => (
                <li key={category}>
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span className="text-foreground">{category}</span>
                    <span className="text-muted">{Math.round(value).toLocaleString()}원</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-background">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(value / maxAsset) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 이력 조회 */}
        <section>
          <h2 className="mb-2 text-sm font-bold text-foreground">재고 변동 이력</h2>
          <div className="mb-3 flex gap-1.5 overflow-x-auto">
            {ACTION_FILTERS.map((a) => (
              <button
                key={a}
                onClick={() => setFilter(a)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === a ? "bg-primary text-primary-ink" : "border border-border text-muted"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">이력이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {shown.map((l) => (
                <li key={l.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
                  <div className="mt-0.5">{ACTION_ICON[l.action_type]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {l.items?.name ?? "(삭제된 품목)"} <span className="text-xs font-normal text-muted">· {l.action_type}</span>
                    </p>
                    <p className="text-xs text-muted">
                      {l.previous_quantity} → {l.new_quantity}
                      {l.change_quantity != null && l.change_quantity !== 0 && (
                        <span className={l.change_quantity > 0 ? "text-ok" : "text-low"}>
                          {" "}({l.change_quantity > 0 ? "+" : ""}{l.change_quantity})
                        </span>
                      )}
                      {" · "}
                      {l.changed_by ?? "-"}
                    </p>
                  </div>
                  <time className="shrink-0 text-[11px] text-muted">{fmt(l.created_at)}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function fmt(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
