// 올짐 서비스 워커: 앱 설치용. 로그인·예약 데이터가 오래된 상태로 보이지 않도록 아무것도 캐시하지 않음.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
