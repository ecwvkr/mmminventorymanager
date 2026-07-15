-- 품목 삭제 기능: inventory_logs 는 품목과 함께 삭제(CASCADE)되도록 FK 재설정.
-- recipes/recipe_ingredients 는 일부러 CASCADE 하지 않음 — 레시피에서 사용 중인
-- 품목은 삭제가 거부되어야 하므로(먼저 레시피 연결을 해제해야 함).
alter table inventory_logs drop constraint if exists inventory_logs_item_id_fkey;
alter table inventory_logs
  add constraint inventory_logs_item_id_fkey
  foreign key (item_id) references items(id) on delete cascade;
