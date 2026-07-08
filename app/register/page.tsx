"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ScanLine, Plus, X, ImagePlus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOperator } from "@/lib/operator";
import ScannerModal from "@/components/ScannerModal";

export default function RegisterPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 폼 상태
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [orderUrl, setOrderUrl] = useState("");
  const [orderContact, setOrderContact] = useState("");
  const [currentStock, setCurrentStock] = useState("0");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("0");
  const [minStock, setMinStock] = useState("0");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [expiration, setExpiration] = useState("");
  const [alertDays, setAlertDays] = useState("7");
  const [barcode, setBarcode] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPeriodic, setIsPeriodic] = useState(false);
  const [interval, setIntervalDays] = useState("");
  const [periodicQty, setPeriodicQty] = useState("");

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
    setImagePreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) {
      setErr("품목명을 입력하세요.");
      return;
    }
    setSaving(true);

    // 이미지 업로드 (선택) — 실패해도 저장은 진행
    let imageUrl: string | null = null;
    if (imageFile) {
      const path = `${Date.now()}_${imageFile.name.replace(/[^\w.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("item-images").upload(path, imageFile);
      if (!upErr) {
        imageUrl = supabase.storage.from("item-images").getPublicUrl(path).data.publicUrl;
      }
    }

    const { data, error } = await supabase
      .from("items")
      .insert({
        name: name.trim(),
        category: category.trim() || null,
        vendor_name: vendorName.trim() || null,
        order_url: orderUrl.trim() || null,
        order_contact: orderContact.trim() || null,
        current_stock: Number(currentStock) || 0,
        unit: unit.trim() || null,
        price: Number(price) || 0,
        min_required_stock: Number(minStock) || 0,
        tags,
        expiration_date: expiration || null,
        expiration_alert_days: Number(alertDays) || 7,
        barcode: barcode.trim() || null,
        image_url: imageUrl,
        is_periodic_order: isPeriodic,
        periodic_interval_days: isPeriodic ? Number(interval) || null : null,
        periodic_order_quantity: isPeriodic ? Number(periodicQty) || null : null,
      })
      .select("id, name")
      .single();

    if (error) {
      setSaving(false);
      setErr(error.message);
      return;
    }

    // 등록 로그
    await supabase.from("inventory_logs").insert({
      item_id: data!.id,
      action_type: "등록",
      previous_quantity: 0,
      change_quantity: Number(currentStock) || 0,
      new_quantity: Number(currentStock) || 0,
      changed_by: getOperator(),
    });

    setSaving(false);
    setSavedName(data!.name);
    resetForm();
  }

  function resetForm() {
    setName(""); setCategory(""); setVendorName(""); setOrderUrl(""); setOrderContact("");
    setCurrentStock("0"); setUnit(""); setPrice("0"); setMinStock("0"); setTags([]); setTagInput("");
    setExpiration(""); setAlertDays("7"); setBarcode(""); setImageFile(null); setImagePreview(null);
    setIsPeriodic(false); setIntervalDays(""); setPeriodicQty("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-foreground">재고등록</h1>
        <p className="text-xs text-muted">새 품목 추가</p>
      </header>

      <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 p-4">
        {savedName && (
          <div className="flex items-center gap-2 rounded-xl bg-ok/10 p-3 text-sm text-ok">
            <CheckCircle2 size={18} />
            <span className="flex-1">‘{savedName}’ 등록 완료.</span>
            <Link href="/inventory" className="font-semibold underline">재고관리로</Link>
          </div>
        )}

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
          <Field label="초기 재고"><input type="number" value={currentStock} onChange={(e) => setCurrentStock(e.target.value)} className={inputCls} /></Field>
          <Field label="단위"><input value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls} placeholder="개 / kg / 병" /></Field>
          <Field label="가격(원)"><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} /></Field>
          <Field label="최소 보유 수량"><input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className={inputCls} /></Field>
        </div>

        <Field label="거래처명"><input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={inputCls} placeholder="예: 무무무로스터리" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="구매처 링크"><input value={orderUrl} onChange={(e) => setOrderUrl(e.target.value)} className={inputCls} placeholder="https://…" /></Field>
          <Field label="연락처"><input value={orderContact} onChange={(e) => setOrderContact(e.target.value)} className={inputCls} placeholder="010-…" /></Field>
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

        {err && <p className="rounded-lg bg-low/10 p-2 text-sm text-low">{err}</p>}

        <button type="submit" disabled={saving} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-ink disabled:opacity-40">
          {saving ? "저장 중…" : "품목 등록"}
        </button>
      </form>

      {scanning && (
        <ScannerModal
          onDetect={(text) => { setBarcode(text); setScanning(false); }}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
