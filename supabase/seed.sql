-- (선택) UI 확인용 시드 데이터. Supabase SQL Editor에서 0001_init.sql 실행 후 돌리면 됨.
insert into items (name, category, price, unit, current_stock, min_required_stock, tags, vendor_name, order_url, order_contact, expiration_date, is_pinned, is_periodic_order, periodic_interval_days, periodic_order_quantity, last_ordered_date) values
  ('에티오피아 예가체프 원두', '원두', 28000, 'kg', 3, 5, '{#원두,#시즌}', '무무무로스터리', 'https://example.com/order', '010-1234-5678', '2026-09-01', true, true, 14, 10, now() - interval '20 days'),
  ('서울우유 1L', '유제품', 2800, '개', 12, 20, '{#우유}', '식자재마트', 'https://example.com/milk', '02-000-0000', '2026-07-12', true, false, null, null, null),
  ('바닐라 시럽', '시럽', 9000, '병', 2, 3, '{#시럽}', '식자재마트', 'https://example.com/syrup', '02-000-0000', null, false, false, null, null, null),
  ('테이크아웃 컵 16oz', '소모품', 45000, '박스', 8, 4, '{#소모품}', '포장자재상사', 'https://example.com/cup', '031-111-2222', null, false, true, 30, 5, now() - interval '35 days'),
  ('초콜릿 파우더', '파우더', 15000, '봉', 6, 3, '{#파우더,#겨울시즌}', '무무무로스터리', 'https://example.com/choco', '010-1234-5678', '2026-08-20', false, false, null, null, null);
