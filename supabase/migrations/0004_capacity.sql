-- 재고등록: 용량(1단위당 실제 내용량) 컬럼 추가. 환산가(구매가/용량)는 저장하지 않고 화면에서 계산.
alter table items add column if not exists capacity numeric;
