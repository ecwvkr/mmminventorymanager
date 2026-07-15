"use client";

import { useRef, useState } from "react";
import { X, ScanLine } from "lucide-react";
import { useBarcodeScanner } from "@/lib/useBarcodeScanner";
import type { Item } from "@/lib/types";
import type { CartLine } from "./CartPanel";
import { type ChangeType, defaultQty } from "./StepperModal";
import { capacityLabel, formatStock } from "@/lib/format";
import StockInput from "@/components/StockInput";

const MODES: { t: ChangeType; label: string }[] = [
  { t: "입고", label: "입고 [+]" },
  { t: "출고", label: "출고 [−]" },
  { t: "실사", label: "실사 [=]" },
];

// 재고관리 전용: 모드를 먼저 고르고 나면 카메라가 계속 켜진 채로 여러 품목을 연속 스캔해
// 장바구니에 담을 수 있다. 사용자가 직접 닫기 전까지 카메라는 유지된다.
export default function ScanCartModal({
  items,
  cartCount,
  onAdd,
  onClose,
}: {
  items: Item[];
  cartCount: number;
  onAdd: (line: CartLine) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<ChangeType | null>(null);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {mode === null ? (
        <ModeSelectScreen onSelect={setMode} onClose={onClose} />
      ) : (
        <ScannerCartView mode={mode} items={items} cartCount={cartCount} onAdd={onAdd} onClose={onClose} />
      )}
    </div>
  );
}

function ModeSelectScreen({ onSelect, onClose }: { onSelect: (m: ChangeType) => void; onClose: () => void }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-white">
      <button onClick={onClose} className="absolute right-4 top-4 text-white/80" aria-label="닫기">
        <X size={22} />
      </button>
      <ScanLine size={40} className="text-white/60" />
      <p className="text-sm text-white/80">스캔한 품목을 어떻게 반영할까요?</p>
      <div className="grid w-full max-w-xs grid-cols-1 gap-3">
        {MODES.map(({ t, label }) => (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className="rounded-xl border border-white/30 bg-white/10 py-3 text-base font-semibold text-white"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScannerCartView({
  mode,
  items,
  cartCount,
  onAdd,
  onClose,
}: {
  mode: ChangeType;
  items: Item[];
  cartCount: number;
  onAdd: (line: CartLine) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [found, setFound] = useState<Item | null>(null);
  const [qty, setQty] = useState(1);
  const [notFoundMsg, setNotFoundMsg] = useState<string | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const foundRef = useRef<Item | null>(null);

  function handleDetect(text: string) {
    if (foundRef.current) return; // 팝업이 떠 있는 동안은 새 스캔 무시
    const item = items.find((i) => i.barcode === text);
    if (!item) {
      setNotFoundMsg(`등록되지 않은 바코드: ${text}`);
      setTimeout(() => setNotFoundMsg(null), 1500);
      return;
    }
    foundRef.current = item;
    setFound(item);
    setQty(defaultQty(mode, item));
  }

  useBarcodeScanner(videoRef, handleDetect, {
    continuous: true,
    onError: () => setCamErr("카메라를 열 수 없습니다. 브라우저 권한을 확인하세요."),
  });

  function dismissFound() {
    foundRef.current = null;
    setFound(null);
  }

  function confirmAdd() {
    if (!found) return;
    onAdd({ item: found, type: mode, qty });
    setSessionCount((n) => n + 1);
    dismissFound();
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3 text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">{mode} 모드</span>
        <span className="text-xs text-white/80">이번 세션 {sessionCount}건 · 전체 장바구니 {cartCount + sessionCount}건</span>
        <button onClick={onClose} className="text-white/80" aria-label="닫기">
          <X size={22} />
        </button>
      </div>

      {camErr ? (
        <p className="flex h-full items-center justify-center px-8 text-center text-sm text-white/80">{camErr}</p>
      ) : (
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      )}

      {notFoundMsg && (
        <p className="absolute inset-x-4 bottom-20 rounded-lg bg-low/90 px-3 py-2 text-center text-sm text-white">{notFoundMsg}</p>
      )}

      <p className="absolute inset-x-0 bottom-4 text-center text-xs text-white/60">
        코드를 화면 중앙에 맞추면 자동 인식됩니다 · 여러 개를 연속으로 스캔할 수 있습니다
      </p>

      {found && (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/60 sm:items-center" onClick={dismissFound}>
          <div className="w-full max-w-sm rounded-t-2xl bg-surface p-5 pb-8 sm:rounded-2xl sm:pb-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold text-muted">{mode}</p>
            <h3 className="mt-0.5 text-base font-bold text-foreground">{found.name}{capacityLabel(found)}</h3>
            <p className="text-xs text-muted">현재 재고 {formatStock(found, found.current_stock)}</p>

            <div className="mt-4 flex items-center justify-center">
              <StockInput
                capacity={found.capacity}
                capacityUnit={found.capacity_unit}
                bundleUnit={found.unit}
                mode={found.stock_display_mode}
                valueBase={qty}
                onChange={setQty}
              />
            </div>

            <button onClick={confirmAdd} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-ink">
              장바구니 담기
            </button>
            <button onClick={dismissFound} className="mt-2 w-full text-center text-xs text-muted underline underline-offset-2">
              취소 (다시 스캔)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
