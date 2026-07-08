// 현재 작업자 (공용 태블릿 모드). 설정(M6)에서 지정, 로그 changed_by 에 기입.
// ponytail: 로그인 도입 시 profiles.id 로 승격
const KEY = "momo_operator";

export function getOperator(): string {
  if (typeof window === "undefined") return "직원";
  return localStorage.getItem(KEY) || "직원";
}

export function setOperator(name: string) {
  localStorage.setItem(KEY, name);
}
