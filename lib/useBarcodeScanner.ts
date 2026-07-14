"use client";

import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

// 후면 카메라 + 연속 오토포커스 지정 — 모바일에서 초점이 안 맞던 문제 개선.
// focusMode/advanced 는 표준 MediaTrackConstraints 타입엔 없지만 Chrome 계열에서 지원되는 확장 제약.
const SCAN_CONSTRAINTS = {
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    advanced: [{ focusMode: "continuous" }],
  },
} as unknown as MediaStreamConstraints;

const DUPLICATE_COOLDOWN_MS = 1500;

export function useBarcodeScanner(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onDetect: (text: string) => void,
  options?: { continuous?: boolean; onError?: () => void }
) {
  const detectRef = useRef(onDetect);
  detectRef.current = onDetect;
  const continuous = options?.continuous ?? false;
  const onErrorRef = useRef(options?.onError);
  onErrorRef.current = options?.onError;

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let controls: IScannerControls | undefined;
    let stopped = false;
    let last: { text: string; at: number } | null = null;

    reader
      .decodeFromConstraints(SCAN_CONSTRAINTS, videoRef.current!, (result, _e, ctrl) => {
        controls = ctrl;
        if (!result || stopped) return;
        const text = result.getText();
        const now = Date.now();
        if (last && last.text === text && now - last.at < DUPLICATE_COOLDOWN_MS) return;
        last = { text, at: now };

        if (!continuous) {
          stopped = true;
          ctrl.stop();
        }
        detectRef.current(text);
      })
      .then((c) => {
        controls = c;
        if (stopped) c.stop();
      })
      .catch(() => onErrorRef.current?.());

    return () => {
      stopped = true;
      try {
        controls?.stop();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, continuous]);
}
