// DB 스키마와 1:1 (supabase/migrations/0001_init.sql)

export type ItemStatus = "정상" | "재고 부족" | "배송중" | "비활성화";
export type ActionType = "입고" | "출고" | "실사" | "상태변경" | "등록";

export interface Item {
  id: string;
  name: string;
  category: string | null;
  price: number;
  unit: string | null;
  capacity: number | null;
  capacity_unit: string | null;
  current_stock: number;
  min_required_stock: number;
  status: ItemStatus;
  tags: string[];
  expiration_date: string | null;
  expiration_alert_days: number;
  order_url: string | null;
  order_contact: string | null;
  vendor_name: string | null;
  barcode: string | null;
  is_active: boolean;
  is_pinned: boolean;
  image_url: string | null;
  memo: string | null;
  is_periodic_order: boolean;
  periodic_interval_days: number | null;
  periodic_order_quantity: number | null;
  pending_order_quantity: number | null;
  last_ordered_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  item_id: string;
  action_type: ActionType;
  previous_quantity: number | null;
  change_quantity: number | null;
  new_quantity: number | null;
  changed_by: string | null;
  created_at: string;
}

// 장바구니 항목 (apply_inventory_changes RPC 페이로드와 매칭)
export interface CartChange {
  item_id: string;
  action_type: "입고" | "출고" | "실사";
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  output_item_id: string;
  output_quantity: number;
  memo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  item_id: string;
  quantity: number;
}

// 조인 조회 결과 (레시피 목록/실행/수정 화면 공용)
export interface RecipeWithDetail extends Recipe {
  output_item: Pick<Item, "id" | "name" | "unit" | "current_stock"> | null;
  recipe_ingredients: (RecipeIngredient & {
    item: Pick<Item, "id" | "name" | "unit" | "current_stock"> | null;
  })[];
}
