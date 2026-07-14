import type { Item } from "./types";

// 품목명 옆에 붙일 (용량+용량단위) 라벨. 재고를 세는 단위(unit)와는 별개.
// 용량 미입력 시 빈 문자열. 예: 우유 12개(재고단위) 중 1개당 1000g(용량) → "(1000g)"
export function capacityLabel(item: Pick<Item, "capacity" | "capacity_unit">): string {
  if (!item.capacity) return "";
  return ` (${item.capacity}${item.capacity_unit ?? ""})`;
}
