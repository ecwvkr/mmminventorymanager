"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOperator } from "@/lib/operator";
import ItemForm, { type ItemPayload } from "@/components/ItemForm";

export default function RegisterPage() {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0); // 저장 후 폼 리셋용

  async function handleSubmit(payload: ItemPayload, imageFile: File | null) {
    setErr(null);
    if (!payload.name) {
      setErr("품목명을 입력하세요.");
      return;
    }
    setSaving(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const path = `${Date.now()}_${imageFile.name.replace(/[^\w.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("item-images").upload(path, imageFile);
      if (!upErr) imageUrl = supabase.storage.from("item-images").getPublicUrl(path).data.publicUrl;
    }

    const { data, error } = await supabase
      .from("items")
      .insert({ ...payload, image_url: imageUrl })
      .select("id, name")
      .single();

    if (error) {
      setSaving(false);
      setErr(error.message);
      return;
    }

    await supabase.from("inventory_logs").insert({
      item_id: data!.id,
      action_type: "등록",
      previous_quantity: 0,
      change_quantity: payload.current_stock,
      new_quantity: payload.current_stock,
      changed_by: getOperator(),
    });

    setSaving(false);
    setSavedName(data!.name);
    setFormKey((k) => k + 1);
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <h1 className="text-lg font-bold text-foreground">재고등록</h1>
        <p className="text-xs text-muted">새 품목 추가</p>
      </header>

      <div className="mx-auto max-w-xl space-y-4 p-4">
        {savedName && (
          <div className="flex items-center gap-2 rounded-xl bg-ok/10 p-3 text-sm text-ok">
            <CheckCircle2 size={18} />
            <span className="flex-1">‘{savedName}’ 등록 완료.</span>
            <Link href="/inventory" className="font-semibold underline">재고관리로</Link>
          </div>
        )}
        <ItemForm key={formKey} mode="create" submitLabel="품목 등록" saving={saving} error={err} onSubmit={handleSubmit} />
      </div>
    </>
  );
}
