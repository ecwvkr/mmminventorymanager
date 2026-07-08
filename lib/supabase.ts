import { createClient } from "@supabase/supabase-js";

// 공용 태블릿 모드: 로그인 없이 anon 키로 접근. 직원 증가 시 Supabase Auth 활성화 예정.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // ponytail: 환경변수 누락 시 빌드가 아닌 런타임에 명확히 실패하도록. .env.local 참고
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");
