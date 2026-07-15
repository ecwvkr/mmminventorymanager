import type { Item } from "./types";

// 품목명 옆에 붙일 (용량+용량단위) 라벨. 재고를 세는 단위(unit)와는 별개.
// 용량 미입력 시 빈 문자열. 예: 우유 12개(재고단위) 중 1개당 1000g(용량) → "(1000g)"
export function capacityLabel(item: Pick<Item, "capacity" | "capacity_unit">): string {
  if (!item.capacity) return "";
  return ` (${item.capacity}${item.capacity_unit ?? ""})`;
}

// 재고는 항상 내용물 단위(개/g/ml = capacity_unit)로 저장됨. 용량이 없는 품목은
// 애초에 묶음 개념이 없어 unit 자체가 저장 단위(예: 원두 kg).
export function baseUnitLabel(item: Pick<Item, "capacity" | "capacity_unit" | "unit">): string {
  return (item.capacity ? item.capacity_unit : item.unit) ?? "";
}

// 재고(또는 재고와 같은 척도의 수량)를 품목별 표시 설정에 맞춰 문자열로 변환.
// 개별: "112개" · 묶음: "3판 22개" (나머지 0이면 "3판")
export function formatStock(
  item: Pick<Item, "capacity" | "capacity_unit" | "unit" | "stock_display_mode">,
  valueBase: number
): string {
  const useBundle = item.stock_display_mode === "묶음" && !!item.capacity && !!item.unit;
  if (!useBundle) return `${valueBase}${baseUnitLabel(item)}`;

  const capacity = item.capacity as number;
  const bundles = Math.floor(valueBase / capacity);
  const remainder = valueBase - bundles * capacity;
  return remainder === 0 ? `${bundles}${item.unit}` : `${bundles}${item.unit} ${remainder}${item.capacity_unit ?? ""}`;
}
