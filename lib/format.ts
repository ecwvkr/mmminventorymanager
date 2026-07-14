import type { Item } from "./types";

// 품목명 옆에 붙일 (용량+단위) 라벨. 용량 미입력 시 빈 문자열.
export function capacityLabel(item: Pick<Item, "capacity" | "unit">): string {
  if (!item.capacity) return "";
  return ` (${item.capacity}${item.unit ?? ""})`;
}
