-- M3: 바코드 컬럼 + 품목 이미지 스토리지
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run

-- 바코드/QR ↔ 품목 연결 (명세 4.1.4). 스캔 시 이 값으로 품목 조회
alter table items add column if not exists barcode text;
create index if not exists idx_items_barcode on items(barcode);

-- 품목 이미지 버킷 (공용 태블릿 모드: anon 업로드/조회 허용)
insert into storage.buckets (id, name, public)
values ('item-images', 'item-images', true)
on conflict (id) do nothing;

-- ponytail: anon 전체 허용. 로그인 도입 시 auth 기반으로 좁히기
drop policy if exists "public read item-images" on storage.objects;
create policy "public read item-images" on storage.objects
  for select using (bucket_id = 'item-images');

drop policy if exists "public upload item-images" on storage.objects;
create policy "public upload item-images" on storage.objects
  for insert with check (bucket_id = 'item-images');
