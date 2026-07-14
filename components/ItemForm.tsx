"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine, Plus, X, ImagePlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ScannerModal from "@/components/ScannerModal";
import type { Item } from "@/lib/types";

// items 테이블에 insert/update 할 컬럼 페이로드 (id/status/created/updated 제외)
export interface ItemPayload {
  name: string;
  category: string | null;
  vendor_name: string | null;
  order_url: string | null;
  order_contact: string | null;
  current_stock: number;
  unit: string | null;
  capacity: number | null;
  price: number;
  min_required_stock: number;
  tags: string[];
  expiration_date: string | null;
  expiration_alert_days: number;
  barcode: string | null;
  memo: string | null;
  is_pinned: boolean;
  is_active: boolean;
  is_periodic_order: boolean;
  periodic_interval_days: number | null;
  periodic_order_quantity: number | null;
}

export default function ItemForm({
  initial,
  mode,
  submitLabel,
  saving,
  error,
  onSubmit,
}: {
  initial?: Item | null;
  mode: "create" | "edit";
  submitLabel: string;
  saving: boolean;
  error: string | null;
  onSubmit: (payload: ItemPayload, imageFile: File | null) => void;
}) {
  const [categories, setCategories] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [vendorName, setVendorName] = useState(initial?.vendor_name ?? "");
  const [orderUrl, setOrderUrl] = useState(initial?.order_url ?? "");
  const [orderContact, setOrderContact] = useState(initial?.order_contact ?? "");
  const [currentStock, setCurrentStock] = useState(String(initial?.current_stock ?? 0));
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity != null ? String(initial.capacity) : "");
  const [price, setPrice] = useState(String(initial?.price ?? 0));
  const [minStock, setMinStock] = useState(String(initial?.min_required_stock ?? 0));
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [expiration, setExpiration] = useState(initial?.expiration_date ?? "");
  const [alertDays, setAlertDays] = useState(String(initial?.expiration_alert_days ?? 7));
  const [barcode, setBarcode] = useState(initial?.barcode ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [isPinned, setIsPinned] = useState(initial?.is_pinned ?? false);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null);
  const [isPeriodic, setIsPeriodic] = useState(initial?.is_periodic_order ?? false);
  const [interval, setIntervalDays] = useState(initial?.periodic_interval_days?.toString() ?? "");
  const [periodicQty, setPeriodicQty] = useState(initial?.periodic_order_quantity?.toString() ?? "");

  useEffect(() => {
    supabase
      .from("items")
      .select("category")
      .not("category", "is", null)
      .then(({ data }) => {
        if (data) setCategories(Array.from(new Set(data.map((r) => r.category as string))));
      });
  }, []);

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    const tag = t.startsWith("#") ? t : `#${t}`;
    if (!tags.includes(tag)) setTags([...tags, tag]);
    setTagInput("");
  }

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    setImagePreview(f ? URL.createObjectURL(f) : initial?.image_url ?? null);
  }

  // 환산가 = 구매가 ÷ 용량 (저장하지 않고 그때그때 계산해서 보여줌)
  const unitPrice = (() => {
    const p = Number(price);
    const c = Number(capacity);
    if (!p || !c) return null;
    return Math.round(p / c);
  })();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(
      {
        name: name.trim(),
        category: category.trim() || null,
        vendor_name: vendorName.trim() || null,
        order_url: orderUrl.trim() || null,
        order_contact: orderContact.trim() || null,
        current_stock: Number(currentStock) || 0,
        unit: unit.trim() || null,
        capacity: capacity ? Number(capacity) : null,
        price: Number(price) || 0,
        min_required_stock: Number(minStock) || 0,
        tags,
        expiration_date: expiration || null,
        expiration_alert_days: Number(alertDays) || 7,
        barcode: barcode.trim() || null,
        memo: memo.trim() || null,
        is_pinned: isPinned,
        is_active: isActive,
        is_periodic_order: isPeriodic,
        periodic_interval_days: isPeriodic ? Number(interval) || null : null,
        periodic_order_quantity: isPeriodic ? Number(periodicQty) || null : null,
      },
      imageFile
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* 이미지 */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">이미지</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-surface text-muted"
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="미리보기" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus size={24} /> 사진 선택
            </span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
      </div>

      <Field label="품목명 *">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="예: 에티오피아 예가체프 원두" />
      </Field>

      <Field label="카테고리">
        <input list="cat-list" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="기존 선택 또는 새로 입력" />
        <datalist id="cat-list">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="용량"><input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className={inputCls} placeholder="예: 1 (1kg 포장이면 1)" /></Field>
        <Field label="단위"><input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} placeholder="개 / kg / 병" /></Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="구매가(원)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} /></Field>
        <Field label="환산가">
          <div className={`${inputCls} flex items-center text-muted`}>
            {unitPrice !== null ? `${unitPrice.toLocaleString()}원/${unit || "단위"}` : "용량·구매가 입력 시 자동 계산"}
          </div>
        </Field>
      </div>

      <Field label="거래처명"><input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputCls} placeholder="예: 무무무로스터리" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="구매처 링크"><input value={orderUrl} onChange={(e) => setOrderUrl(e.target.value)} className={inputCls} placeholder="https://…" /></Field>
        <Field label="연락처"><input value={orderContact} onChange={(e) => setOrderContact(e.target.value)} className={inputCls} placeholder="010-…" /></Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="현재 재고"><input type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} className={inputCls} /></Field>
        <Field label="최소 보유 수량"><input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className={inputCls} /></Field>
      </div>

      {/* 태그 */}
      <Field label="태그">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-xs text-accent">
              {t}
              <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label="태그 삭제"><X size={12} /></button>
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            className={inputCls}
            placeholder="#시즌 입력 후 Enter"
          />
          <button type="button" onClick={addTag} className="shrink-0 rounded-lg border border-border px-3 text-sm text-foreground"><Plus size={16} /></button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="유통기한"><input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} className={inputCls} /></Field>
        <Field label="임박 알림(일 전)"><input type="number" value={alertDays} onChange={(e) => setAlertDays(e.target.value)} className={inputCls} /></Field>
      </div>

      {/* 바코드 + 스캔 */}
      <Field label="바코드 / QR">
        <div className="flex gap-2">
          <input value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputCls} placeholder="스캔 또는 직접 입력" />
          <button type="button" onClick={() => setScanning(true)} className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-medium text-primary-ink">
            <ScanLine size={16} /> 스캔
          </button>
        </div>
      </Field>

      <Field label="메모">
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} className={inputCls} placeholder="비고" />
      </Field>

      {/* 토글: 즐겨찾기 / 활성 */}
      <div className="flex gap-3">
        <label className="flex flex-1 items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground">
          즐겨찾기
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
        </label>
        {mode === "edit" && (
          <label className="flex flex-1 items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground">
            활성
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
          </label>
        )}
      </div>

      {/* 주기적 발주 */}
      <div className="rounded-xl border border-border bg-surface p-3">
        <label className="flex items-center justify-between text-sm font-medium text-foreground">
          주기적 발주 설정
          <input type="checkbox" checked={isPeriodic} onChange={(e) => setIsPeriodic(e.target.checked)} className="h-5 w-5 accent-[var(--primary)]" />
        </label>
        {isPeriodic && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="발주 주기(일)"><input type="number" value={interval} onChange={(e) => setIntervalDays(e.target.value)} className={inputCls} placeholder="14" /></Field>
            <Field label="발주 수량"><input type="number" value={periodicQty} onChange={(e) => setPeriodicQty(e.target.value)} className={inputCls} placeholder="10" /></Field>
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-low/10 p-2 text-sm text-low">{error}</p>}

      <button type="submit" disabled={saving} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-ink disabled:opacity-40">
        {saving ? "저장 중…" : submitLabel}
      </button>

      {scanning && (
        <ScannerModal onDetect={(text) => { setBarcode(text); setScanning(false); }} onClose={() => setScanning(false)} />
      )}
    </form>
  );
}

export const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
