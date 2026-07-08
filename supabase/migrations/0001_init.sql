-- 카페 무무무 인벤토리 매니저 — M1 초기 스키마
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run
-- (공용 태블릿 모드: 로그인 없이 anon 키로 접근. profiles/RLS는 추후 로그인 대비 준비만)

-- ────────────────────────────────────────────────────────────
-- 1. 테이블
-- ────────────────────────────────────────────────────────────

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  price numeric not null default 0,
  unit text,
  current_stock numeric not null default 0,
  min_required_stock numeric not null default 0,
  status text not null default '정상'
    check (status in ('정상','재고 부족','배송중','비활성화')),
  tags text[] not null default '{}',
  expiration_date date,
  expiration_alert_days int not null default 7,   -- [갭B] 품목별 유통기한 임박 알림일수
  order_url text,
  order_contact text,
  vendor_name text,                                -- 비정규화 유지 [갭D]
  is_active boolean not null default true,
  is_pinned boolean not null default false,        -- [갭A] 대시보드 즐겨찾기
  image_url text,
  memo text,
  is_periodic_order boolean not null default false,
  periodic_interval_days numeric,
  periodic_order_quantity numeric,
  pending_order_quantity numeric,                  -- [갭C] 발주 대기 수량 (입고 시 가산 후 null)
  last_ordered_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_logs (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  action_type text not null
    check (action_type in ('입고','출고','실사','상태변경','등록')),
  previous_quantity numeric,
  change_quantity numeric,
  new_quantity numeric,
  changed_by text,
  created_at timestamptz not null default now()
);

-- 로그인 도입 대비 준비만 (지금은 미사용). auth.users 와 1:1
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

create index if not exists idx_items_status on items(status);
create index if not exists idx_items_vendor on items(vendor_name);
create index if not exists idx_logs_item on inventory_logs(item_id);
create index if not exists idx_logs_created on inventory_logs(created_at desc);

-- ────────────────────────────────────────────────────────────
-- 2. 트리거 — 재고부족 자동판정 + updated_at
--    재고를 바꾸는 경로가 여러 곳이라 앱에 흩뿌리지 않고 트리거 한 곳에서 처리
-- ────────────────────────────────────────────────────────────

create or replace function set_item_status() returns trigger as $$
begin
  if NEW.is_active = false then
    NEW.status := '비활성화';
  elsif NEW.status = '배송중' then
    null;  -- 발주 진행 중이면 재고와 무관하게 유지
  elsif NEW.current_stock <= NEW.min_required_stock then
    NEW.status := '재고 부족';
  else
    NEW.status := '정상';
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_item_status on items;
create trigger trg_item_status
  before insert or update on items
  for each row execute function set_item_status();

-- ────────────────────────────────────────────────────────────
-- 3. RPC — 재고 변경은 반드시 트랜잭션(함수 1회 = 1 트랜잭션)으로
--    재고 update + 로그 insert 가 절대 갈라지지 않도록
-- ────────────────────────────────────────────────────────────

-- 3-1. 장바구니 일괄 반영
-- p_changes: [{ "item_id": "...", "action_type": "입고|출고|실사", "quantity": 10 }, ...]
create or replace function apply_inventory_changes(p_changes jsonb, p_operator text)
returns void as $$
declare
  rec jsonb;
  v_prev numeric;
  v_new numeric;
  v_change numeric;
  v_action text;
  v_qty numeric;
  v_id uuid;
begin
  for rec in select * from jsonb_array_elements(p_changes)
  loop
    v_id := (rec->>'item_id')::uuid;
    v_action := rec->>'action_type';
    v_qty := (rec->>'quantity')::numeric;

    select current_stock into v_prev from items where id = v_id for update;
    if not found then
      raise exception '품목을 찾을 수 없습니다: %', v_id;
    end if;

    if v_action = '입고' then
      v_new := v_prev + v_qty;
      v_change := v_qty;
    elsif v_action = '출고' then
      v_new := greatest(v_prev - v_qty, 0);  -- ponytail: 음수 재고 방지, 0으로 클램프
      v_change := v_new - v_prev;
    elsif v_action = '실사' then
      v_new := v_qty;
      v_change := v_new - v_prev;
    else
      raise exception '잘못된 변동 타입: %', v_action;
    end if;

    update items set current_stock = v_new where id = v_id;
    insert into inventory_logs(item_id, action_type, previous_quantity, change_quantity, new_quantity, changed_by)
    values (v_id, v_action, v_prev, v_change, v_new, p_operator);
  end loop;
end;
$$ language plpgsql security definer;

-- 3-2. 발주 완료 → 배송중 전환 + 발주 수량 기록
create or replace function mark_ordered(p_item_id uuid, p_quantity numeric, p_operator text)
returns void as $$
declare v_prev numeric;
begin
  select current_stock into v_prev from items where id = p_item_id for update;
  if not found then raise exception '품목을 찾을 수 없습니다: %', p_item_id; end if;

  update items
    set status = '배송중', last_ordered_date = now(), pending_order_quantity = p_quantity
    where id = p_item_id;

  insert into inventory_logs(item_id, action_type, previous_quantity, change_quantity, new_quantity, changed_by)
  values (p_item_id, '상태변경', v_prev, 0, v_prev, p_operator);
end;
$$ language plpgsql security definer;

-- 3-3. 입고 확인 → 발주 수량만큼 재고 가산 + 상태 복귀 (트리거가 정상/재고부족 재계산)
create or replace function receive_order(p_item_id uuid, p_operator text)
returns void as $$
declare v_prev numeric; v_qty numeric; v_new numeric;
begin
  select current_stock, pending_order_quantity into v_prev, v_qty
    from items where id = p_item_id for update;
  if not found then raise exception '품목을 찾을 수 없습니다: %', p_item_id; end if;
  if v_qty is null then
    raise exception '입고할 발주 수량이 없습니다 (이미 처리되었거나 발주 내역 없음)';  -- 중복 클릭 이중가산 방지
  end if;

  v_new := v_prev + v_qty;
  update items
    set current_stock = v_new, pending_order_quantity = null, status = '정상'
    where id = p_item_id;

  insert into inventory_logs(item_id, action_type, previous_quantity, change_quantity, new_quantity, changed_by)
  values (p_item_id, '입고', v_prev, v_qty, v_new, p_operator);
end;
$$ language plpgsql security definer;

-- ────────────────────────────────────────────────────────────
-- 4. RLS — 공용 태블릿 모드: 지금은 전면 허용
--    ponytail: anon 전체 허용. 로그인(M-후속) 도입 시 auth.uid() 기반 정책으로 교체
-- ────────────────────────────────────────────────────────────

alter table items enable row level security;
alter table inventory_logs enable row level security;
alter table profiles enable row level security;

drop policy if exists "public all - items" on items;
create policy "public all - items" on items for all using (true) with check (true);

drop policy if exists "public all - logs" on inventory_logs;
create policy "public all - logs" on inventory_logs for all using (true) with check (true);

drop policy if exists "public read - profiles" on profiles;
create policy "public read - profiles" on profiles for select using (true);

-- 함수 실행 권한 (anon/authenticated)
grant execute on function apply_inventory_changes(jsonb, text) to anon, authenticated;
grant execute on function mark_ordered(uuid, numeric, text) to anon, authenticated;
grant execute on function receive_order(uuid, text) to anon, authenticated;
