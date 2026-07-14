-- 용량 단위(g/ml 등)를 재고 단위(개/병/박스 등)와 분리
-- 예: 우유는 unit="개"(재고를 개수로 셈), capacity=1000 + capacity_unit="g"(개당 내용량)
alter table items add column if not exists capacity_unit text;
