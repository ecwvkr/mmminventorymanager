"use client";

import { useEffect } from "react";

// 모달 열려있는 동안 Escape 키로 닫기
export function useEscapeKey(onClose: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
}
