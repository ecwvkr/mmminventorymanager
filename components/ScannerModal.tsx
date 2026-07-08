"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { X } from "lucide-react";

// HTML5 카메라 기반 바코드/QR 스캐너. 스캔 성공 시 텍스트를 onDetect 로 전달.
export default function ScannerModal({
  onDetect,
  onClose,
}: {
  onDetect: (text: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: IScannerControls | undefined;
    let stopped = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _e, ctrl) => {
        controls = ctrl;
        if (result && !stopped) {
          stopped = true;
          ctrl.stop();
          onDetect(result.getText());
        }
      })
      .then((c) => {
        controls = c;
        if (stopped) c.stop();
      })
      .catch(() => setErr("카메라를 열 수 없습니다. 브라우저 권한을 확인하세요."));

    return () => {
      stopped = true;
      try {
        controls?.stop();
      } catch {
        /* noop */
      }
    };
  }, [onDetect]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-black" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <span className="text-sm font-semibold">바코드 / QR 스캔</span>
          <button onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        {err ? (
          <p className="p-6 text-center text-sm text-white/80">{err}</p>
        ) : (
          <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
        )}
        <p className="px-4 py-3 text-center text-xs text-white/60">코드를 화면 중앙에 맞추면 자동 인식됩니다.</p>
      </div>
    </div>
  );
}
