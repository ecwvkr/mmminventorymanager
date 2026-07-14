-- 레시피(제조) 기능: 정해진 원재료 소모 + 결과물 생산을 버튼 하나로 처리
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  output_item_id uuid not null references items(id),  -- 결과물로 나오는 품목 (미리 items 에 등록되어 있어야 함)
  output_quantity numeric not null default 1,          -- 기본 산출 수량
  memo text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  item_id uuid not null references items(id),
  quantity numeric not null,  -- 기본 필요 수량
  created_at timestamptz not null default now()
);

create index if not exists idx_recipe_ingredients_recipe on recipe_ingredients(recipe_id);
create index if not exists idx_recipes_output_item on recipes(output_item_id);

-- ────────────────────────────────────────────────────────────
-- 제조 실행 RPC — 원재료 출고 + 결과물 입고를 한 트랜잭션으로
--   p_ingredients: [{ "item_id": "...", "quantity": 5 }, ...]  (일시적 변동 반영된 최종 소모량)
-- ────────────────────────────────────────────────────────────
create or replace function execute_recipe(
  p_recipe_id uuid,
  p_ingredients jsonb,
  p_output_quantity numeric,
  p_operator text
) returns void as $$
declare
  rec jsonb;
  v_item_id uuid;
  v_qty numeric;
  v_prev numeric;
  v_new numeric;
  v_output_item uuid;
begin
  select output_item_id into v_output_item from recipes where id = p_recipe_id;
  if not found then
    raise exception '레시피를 찾을 수 없습니다: %', p_recipe_id;
  end if;

  -- 원재료 출고
  for rec in select * from jsonb_array_elements(p_ingredients)
  loop
    v_item_id := (rec->>'item_id')::uuid;
    v_qty := (rec->>'quantity')::numeric;

    select current_stock into v_prev from items where id = v_item_id for update;
    if not found then
      raise exception '품목을 찾을 수 없습니다: %', v_item_id;
    end if;

    v_new := greatest(v_prev - v_qty, 0);  -- ponytail: 음수 재고 방지, 0으로 클램프 (apply_inventory_changes와 동일 규칙)
    update items set current_stock = v_new where id = v_item_id;
    insert into inventory_logs(item_id, action_type, previous_quantity, change_quantity, new_quantity, changed_by)
    values (v_item_id, '출고', v_prev, v_new - v_prev, v_new, p_operator);
  end loop;

  -- 결과물 입고
  select current_stock into v_prev from items where id = v_output_item for update;
  if not found then
    raise exception '결과물 품목을 찾을 수 없습니다: %', v_output_item;
  end if;
  v_new := v_prev + p_output_quantity;
  update items set current_stock = v_new where id = v_output_item;
  insert into inventory_logs(item_id, action_type, previous_quantity, change_quantity, new_quantity, changed_by)
  values (v_output_item, '입고', v_prev, p_output_quantity, v_new, p_operator);
end;
$$ language plpgsql security definer;

-- RLS — 공용 태블릿 모드: 지금은 전면 허용 (items 테이블과 동일 정책)
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;

drop policy if exists "public all - recipes" on recipes;
create policy "public all - recipes" on recipes for all using (true) with check (true);

drop policy if exists "public all - recipe_ingredients" on recipe_ingredients;
create policy "public all - recipe_ingredients" on recipe_ingredients for all using (true) with check (true);

grant execute on function execute_recipe(uuid, jsonb, numeric, text) to anon, authenticated;
