-- ⚠️ 이 파일은 정확히 1회만 실행하세요. 재실행 시 수량이 중복으로 배율 적용됩니다.
--
-- 재고 저장 기준을 "구매 단위"(판/봉지/포대 개수)에서 "내용물 단위"(개/g/ml, = capacity_unit)로 전환.
-- 예: 계란 4판(판당 30ea) → 기존 current_stock=4 → 변경 후 current_stock=120(ea)
--     레시피에서 "8개 소모"처럼 내용물 단위로 정수 차감 가능해짐.
-- capacity 가 없는 품목(원두처럼 이미 kg 단위로 직접 관리하는 품목)은 ×1 이라 변화 없음.

alter table items
  add column if not exists stock_display_mode text not null default '개별'
  check (stock_display_mode in ('묶음', '개별'));

update items
set
  current_stock = current_stock * coalesce(capacity, 1),
  min_required_stock = min_required_stock * coalesce(capacity, 1),
  pending_order_quantity = pending_order_quantity * coalesce(capacity, 1),
  periodic_order_quantity = periodic_order_quantity * coalesce(capacity, 1);
