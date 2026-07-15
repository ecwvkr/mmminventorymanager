"use client";

import { useState } from "react";
import { X, Trash2 } from "lucide-react";
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

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

  async function handleDelete() {
    setDeleteErr(null);
    setDeleting(true);
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    setDeleting(false);
    if (error) {
      setDeleteErr(
        error.code === "23503"
          ? "이 품목은 레시피 등 다른 곳에서 사용 중이라 삭제할 수 없습니다. 먼저 연결을 해제하세요."
          : error.message
      );
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 sm:p-4" onClick={onClose}>
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

          <div className="mt-6 border-t border-border pt-4">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-low/30 py-2.5 text-sm font-medium text-low"
              >
                <Trash2 size={15} /> 품목 삭제
              </button>
            ) : (
              <div className="rounded-xl border border-low/30 bg-low/5 p-3">
                <p className="mb-2 text-sm text-low">
                  ‘{item.name}’ 품목을 정말 삭제할까요? 재고·이력이 모두 삭제되며 되돌릴 수 없습니다.
                </p>
                {deleteErr && <p className="mb-2 text-xs text-low">{deleteErr}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(false); setDeleteErr(null); }}
                    className="flex-1 rounded-lg border border-border py-2 text-sm text-foreground"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    className="flex-1 rounded-lg bg-low py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {deleting ? "삭제 중…" : "네, 삭제합니다"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
