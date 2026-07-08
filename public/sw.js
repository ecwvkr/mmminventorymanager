// 설치가능성(홈화면 추가·전체화면 실행)을 위한 최소 서비스워커.
// ponytail: 오프라인 캐싱은 넣지 않음 — 재고 데이터는 항상 최신이어야 하므로 stale 캐시가 오히려 버그.
//           오프라인 지원이 필요해지면 Serwist 도입 (docs 참고).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
