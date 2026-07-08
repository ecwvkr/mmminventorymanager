import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "카페 무무무 인벤토리 매니저",
    short_name: "무무무 재고",
    description: "카페 무무무 재고 관리 · 발주 PWA",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf6f0",
    theme_color: "#6f4e37",
    // ponytail: SVG 단일 아이콘으로 시작. 브랜드 확정 후 192/512 PNG + apple-touch-icon(maskable) 추가 (M8)
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
