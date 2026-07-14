"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getOperator } from "@/lib/operator";
import ItemForm, { type ItemPayload } from "@/components/ItemForm";
import StatusBadge from "@/components/StatusBadge";
import type { Item } from "@/lib/types";
import { capacityLabel } from "@/lib/format";

export default function ItemDetailModal({
  item,
  onClose,
  onSaved,
}: {
  item: Item;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(payload: ItemPayload, imageFile: File | null) {
    setErr(null);
    if (!payload.name) {
      setErr("품목명을 입력하세요.");
      return;
    }
    setSaving(true);

    let imageUrl = item.image_url;
    if (imageFile) {
      const path = `${Date.now()}_${imageFile.name.replace(/[^\w.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("item-images").upload(path, imageFile);
      if (!upErr) imageUrl = supabase.storage.from("item-images").getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from("items").update({ ...payload, image_url: imageUrl }).eq("id", item.id);
    if (error) {
      setSaving(false);
      setErr(error.message);
      return;
    }

    // 재고 수량이 바뀌었으면 실사 로그로 기록
    if (payload.current_stock !== item.current_stock) {
      await supabase.from("inventory_logs").insert({
        item_id: item.id,
        action_type: "실사",
        previous_quantity: item.current_stock,
        change_quantity: payload.current_stock - item.current_stock,
        new_quantity: payload.current_stock,
        changed_by: getOperator(),
      });
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/40 sm:p-4" onClick={onClose}>
      <div
        className="min-h-full w-full max-w-xl bg-background sm:min-h-0 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-base font-bold text-foreground">{item.name}{capacityLabel(item)}</h2>
            <StatusBadge status={item.status} />
          </div>
          <button onClick={onClose} aria-label="닫기" className="shrink-0 text-muted">
            <X size={20} />
          </button>
        </header>
        <div className="p-4">
          <ItemForm initial={item} mode="edit" submitLabel="저장" saving={saving} error={err} onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
