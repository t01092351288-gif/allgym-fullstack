# 올짐 피트니스 백엔드

Node.js + Express + PostgreSQL + Redis 로 구현된 올짐 피트니스 예약 관리 시스템의 백엔드입니다.
세션쿠키 기반 인증과 카카오 OAuth(폴백 가능), 예약/슬롯/트레이너/관리자 API를 포함합니다.

---

## 1. 빠른 시작 (로컬 개발)

### 1.1 사전 준비
- Node.js 18 이상
- PostgreSQL 14 이상
- Redis 6 이상

### 1.2 설치

```bash
git clone <repo>
cd allgym-backend
cp .env.example .env
# .env 안의 DATABASE_URL, REDIS_URL, SESSION_SECRET 등을 환경에 맞게 수정
npm install
```

### 1.3 DB 초기화 & 시드

```bash
# 1) 스키마 생성
npm run migrate

# 2) 샘플 데이터 (지점 2, 트레이너 3, 고객 2, 7일치 슬롯)
npm run seed
```

### 1.4 실행

```bash
npm run dev
# → http://localhost:4000
# 헬스체크: GET /health
```

---

## 2. Docker Compose (선택)

```yaml
# docker-compose.yml (예시)
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: oljim
      POSTGRES_PASSWORD: oljim
      POSTGRES_DB: oljim
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

```bash
docker compose up -d
npm run migrate && npm run seed
npm run dev
```

---

## 3. 카카오 로그인 설정

### 3.1 카카오 키 발급
1. https://developers.kakao.com 접속 → **내 애플리케이션**
2. **앱 키 → REST API 키** 복사 → `.env`의 `KAKAO_REST_API_KEY`
3. **앱 설정 → 플랫폼 → Web** 등록 (예: `http://localhost:4000`)
4. **카카오 로그인 → 활성화 ON**
5. **카카오 로그인 → Redirect URI** 등록  
   → `http://localhost:4000/v1/auth/kakao/callback`  
   → `.env`의 `KAKAO_REDIRECT_URI`와 동일하게 입력
6. **카카오 로그인 → 동의항목** 에서 `프로필 정보(닉네임)` 필수 동의로 설정

### 3.2 폴백 모드 (카카오 키 없이 테스트)
`.env`에서 다음과 같이 설정하면 카카오 키 없이도 로그인이 동작합니다 (테스트용 가짜 카카오 사용자 생성).

```
ENABLE_KAKAO_FALLBACK=true
```

### 3.3 사용 흐름
```
프론트:   <a href="http://localhost:4000/v1/auth/kakao">카카오로 로그인</a>
백엔드:   /v1/auth/kakao             → 카카오 인증 페이지로 리다이렉트
카카오:   사용자 동의 → /v1/auth/kakao/callback?code=...
백엔드:   토큰 교환 + 프로필 조회 + 세션 발급
        → WEB_BASE_URL/login/callback 로 리다이렉트
```

---

## 4. API 목록 (요약)

| Method | Endpoint                                  | 권한        | 설명                            |
| ------ | ----------------------------------------- | ----------- | ------------------------------- |
| POST   | /v1/auth/phone/send                        | -           | 전화번호 인증코드 발송          |
| POST   | /v1/auth/phone/verify                      | -           | 인증코드 검증 + 세션 발급       |
| GET    | /v1/auth/kakao                             | -           | 카카오 OAuth 시작               |
| GET    | /v1/auth/kakao/callback                    | -           | 카카오 OAuth 콜백               |
| GET    | /v1/auth/me                                | 옵션        | 현재 세션 사용자                 |
| POST   | /v1/auth/logout                            | 옵션        | 로그아웃                        |
| POST   | /v1/auth/dev/switch-role                   | 인증        | (개발용) 역할 변경              |
| GET    | /v1/branches                               | -           | 지점 목록                       |
| GET    | /v1/branches/:id/slots?date=YYYY-MM-DD     | -           | 지점·날짜별 슬롯 조회           |
| POST   | /v1/slots/:id/lock                         | 인증        | 슬롯 임시 잠금 (Redis 5분)      |
| POST   | /v1/reservations                           | 인증        | 예약 생성                       |
| GET    | /v1/reservations/me                        | 인증        | 내 예약 목록                    |
| GET    | /v1/reservations/:id                       | 본인/관리자 | 예약 단건                       |
| DELETE | /v1/reservations/:id                       | 본인/관리자 | 예약 취소                       |
| GET    | /v1/trainer/schedule?date=                 | 트레이너    | 내 시간표                       |
| PATCH  | /v1/trainer/reservations/:id/approve       | 트레이너    | 예약 승인                       |
| PATCH  | /v1/trainer/reservations/:id/reject        | 트레이너    | 예약 거절                       |
| POST   | /v1/trainer/customers/:id/memo             | 트레이너    | 고객 메모 작성                  |
| GET    | /v1/trainer/customers/:id/memos            | 트레이너    | 고객 메모 조회                  |
| GET    | /v1/admin/dashboard                        | 관리자      | 통합 대시보드                   |
| GET    | /v1/admin/trainers                         | 관리자      | 트레이너 목록                   |
| POST   | /v1/admin/trainers                         | 관리자      | 트레이너 등록                   |
| PATCH  | /v1/admin/trainers/:id                     | 관리자      | 트레이너 수정                   |
| POST   | /v1/admin/slots/bulk                       | 관리자      | 슬롯 일괄 생성                  |
| PATCH  | /v1/admin/slots/:id/lock                   | 관리자      | 슬롯 잠금/해제                  |
| GET    | /v1/admin/stats?month=YYYY-MM              | 관리자      | 월별 통계                       |

모든 응답은 다음 공통 형식을 따릅니다.

```json
// 성공
{ "success": true, "data": {...} }

// 실패
{ "success": false, "error": { "code": "...", "message": "..." } }
```

---

## 5. 배포 가이드

### 5.1 Render.com (Node + PostgreSQL + Redis)
1. **PostgreSQL** 신규 생성 → Internal Database URL 복사
2. **Redis** 신규 생성 → Internal Redis URL 복사
3. **Web Service** 신규 → 이 레포 연결
4. Environment Variables 설정:
   - `DATABASE_URL`, `REDIS_URL`
   - `SESSION_SECRET`, `JWT_SECRET` (랜덤 긴 문자열)
   - `WEB_BASE_URL=https://your-frontend.vercel.app`
   - `KAKAO_REST_API_KEY`, `KAKAO_REDIRECT_URI=https://<service>.onrender.com/v1/auth/kakao/callback`
   - `COOKIE_SECURE=true`
   - `PGSSL=true`
5. Build Command: `npm install`
6. Start Command: `npm run migrate && npm run seed && npm start`  
   (재배포마다 시드를 돌리고 싶지 않으면 `npm start`만 사용)

### 5.2 Vercel (프론트엔드만 권장)
Vercel은 장시간 실행되는 Express + Redis 세션에 적합하지 않습니다.  
**프론트엔드는 Vercel**, **백엔드는 Render/Fly.io/Railway** 조합을 권장합니다.

만약 굳이 Vercel에 올린다면:
- `vercel.json`을 추가해 모든 요청을 `src/server.js`로 라우팅
- Redis는 Upstash 등 서버리스 Redis 사용
- 세션은 JWT 토큰 기반으로 전환 권장

### 5.3 환경별 카카오 Redirect URI
| 환경 | Redirect URI |
| ---- | ------------ |
| 로컬 | `http://localhost:4000/v1/auth/kakao/callback` |
| 스테이징 | `https://staging.api.oljim.kr/v1/auth/kakao/callback` |
| 프로덕션 | `https://api.oljim.kr/v1/auth/kakao/callback` |

> 카카오 디벨로퍼스의 Redirect URI에 위 주소를 **모두** 등록해두세요.

---

## 6. 폴더 구조

```
allgym-backend/
├── sql/schema.sql
├── src/
│   ├── server.js
│   ├── config/{db.js, redis.js}
│   ├── middleware/{auth.js, errorHandler.js}
│   ├── utils/{ApiError.js, respond.js}
│   ├── services/{kakao.js, slotLock.js}
│   ├── db/{migrate.js, seed.js}
│   └── routes/
│       ├── index.js, auth.js, branches.js, slots.js,
│       │   reservations.js, trainer.js, admin.js
├── .env.example
├── package.json
└── README.md
```

---

## 7. 다음 단계

- [ ] CoolSMS / 카카오 알림톡 실제 발송 연동 (`src/services/notify.js`)
- [ ] 슬롯 잠금 → 결제 → 확정 워크플로우
- [ ] 트레이너 휴무/휴가 관리
- [ ] 통계 엑셀 내보내기 (`exceljs`)
- [ ] CI/CD (GitHub Actions → Render)
