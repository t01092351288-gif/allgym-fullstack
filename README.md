# ALLgym 예약 관리 시스템

> 고객 예약, 트레이너 승인, 관리자 운영 기능을 하나로 통합한 ALLgym 전용 예약 관리 웹앱입니다.

ALLgym 예약 관리 시스템은 회원이 직접 예약하고, 트레이너가 일정을 확인·승인하며, 관리자가 지점/트레이너/슬롯/통계를 운영할 수 있도록 만든 풀스택 프로젝트입니다. 프론트엔드는 **Next.js 15**, 백엔드는 **Express + PostgreSQL + Redis** 기반으로 구성되어 있으며, 운영 배포는 **Vercel + Render** 조합을 권장합니다.

- 회원 웹앱 주소(운영 예정): `https://app.allgym.kr`
- 백엔드 API 주소(운영 예정): `https://api.allgym.kr`
- 카카오 로그인 콜백 주소(운영 예정): `https://api.allgym.kr/v1/auth/kakao/callback`

---

## 1. 주요 기능

### 1) 고객 기능
- 전화번호 인증 로그인
- 카카오 로그인(운영) / 폴백 로그인(테스트)
- 지점 선택 → 날짜 선택 → 시간 선택의 3단계 예약 흐름
- 예약 생성 / 내 예약 조회 / 예약 취소
- 2시간 전 무료 취소 기준 반영

### 2) 트레이너 기능
- 일자별 일정 조회
- 예약 승인 / 거절
- 고객 메모 작성 / 조회

### 3) 관리자 기능
- 지점별 예약 현황 대시보드
- 트레이너 등록 / 수정 / 활성화 관리
- 슬롯 일괄 생성
- 슬롯 잠금 / 해제
- 월별 통계 및 인기 시간대 확인

### 4) 시스템 기능
- 세션 쿠키 기반 인증
- Redis 기반 슬롯 임시 잠금
- PostgreSQL 트랜잭션 기반 중복 예약 방지
- 공통 API 응답 형식 및 에러 처리
- Rate Limit / Helmet / CORS 보안 설정

---

## 2. 기술 스택

### 프론트엔드
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS

### 백엔드
- Node.js 18+
- Express
- PostgreSQL
- Redis
- express-session + connect-redis
- Kakao OAuth

### 배포 권장 환경
- 프론트엔드: Vercel
- 백엔드: Render Web Service
- 데이터베이스: Render PostgreSQL
- Redis: Render Redis 또는 Upstash Redis

---

## 3. 저장소 구조

> 아래는 ALLgym 기준 권장 구조입니다.

```text
allgym-fullstack/
├── allgym-backend/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── sql/
│   ├── .env.example
│   ├── .env.production.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── render.yaml
│   └── package.json
│
├── allgym-frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
│
├── README.md
├── DEPLOYMENT.md
├── OPERATIONS-HANDOVER.md
├── CHANGELOG.md
├── .gitignore
├── package.json
├── run-local.sh
└── run-local.bat
```

---

## 4. 설치 및 로컬 실행

### 사전 준비
아래 프로그램이 먼저 설치되어 있어야 합니다.
- Node.js 18 이상
- npm
- Docker Desktop 또는 Docker Engine
- Git

### 1) 저장소 복제
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL> allgym-fullstack
cd allgym-fullstack
```

### 2) 환경변수 파일 생성
```bash
cp allgym-backend/.env.example allgym-backend/.env
cp allgym-frontend/.env.example allgym-frontend/.env.local
```

> 현재 폴더명이 아직 `allgym-backend`, `allgym-frontend`로 유지되어 있다면, 실제 폴더명에 맞춰 명령어만 바꿔서 사용하면 됩니다.

### 3) 의존성 설치
```bash
npm install
npm run install:all
```

### 4) DB / Redis 실행 및 초기 세팅
```bash
npm run docker:up
npm run migrate
npm run seed
```

### 5) 프론트 + 백엔드 동시 실행
```bash
npm run dev
```

### 6) 접속 주소
- 프론트엔드: http://localhost:3000
- 백엔드: http://localhost:4000
- 헬스체크: http://localhost:4000/health

### 자주 쓰는 명령어
```bash
npm run install:all   # 프론트/백엔드 의존성 설치
npm run docker:up     # PostgreSQL / Redis 시작
npm run docker:down   # PostgreSQL / Redis 종료
npm run migrate       # DB 스키마 적용
npm run seed          # 샘플 데이터 생성
npm run dev           # 프론트/백엔드 동시 실행
npm run build         # 프론트 빌드 검증
```

---

## 5. 환경변수

### 백엔드 예시 (`allgym-backend/.env`)
```env
NODE_ENV=development
PORT=4000
APP_BASE_URL=http://localhost:4000
WEB_BASE_URL=http://localhost:3000
DATABASE_URL=postgres://allgym:allgym@localhost:5432/allgym
PGSSL=false
REDIS_URL=redis://localhost:6379
SESSION_SECRET=replace_with_long_random_string
JWT_SECRET=replace_with_long_random_string
JWT_EXPIRES_IN=7d
COOKIE_SECURE=false
COOKIE_DOMAIN=
KAKAO_REST_API_KEY=
KAKAO_REDIRECT_URI=http://localhost:4000/v1/auth/kakao/callback
ENABLE_KAKAO_FALLBACK=true
COOLSMS_API_KEY=
COOLSMS_API_SECRET=
KAKAO_BIZ_SENDER_KEY=
```

### 프론트엔드 예시 (`allgym-frontend/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 운영 환경 예시
```env
APP_BASE_URL=https://api.allgym.kr
WEB_BASE_URL=https://app.allgym.kr
KAKAO_REDIRECT_URI=https://api.allgym.kr/v1/auth/kakao/callback
COOKIE_SECURE=true
COOKIE_DOMAIN=.allgym.kr
NEXT_PUBLIC_API_BASE_URL=https://api.allgym.kr
```

---

## 6. 주요 API 범위

### 인증
- `POST /v1/auth/phone/send`
- `POST /v1/auth/phone/verify`
- `GET /v1/auth/kakao`
- `GET /v1/auth/kakao/callback`
- `GET /v1/auth/me`
- `POST /v1/auth/logout`

### 고객 예약
- `GET /v1/branches`
- `GET /v1/branches/:id/slots?date=YYYY-MM-DD`
- `POST /v1/slots/:id/lock`
- `POST /v1/reservations`
- `GET /v1/reservations/me`
- `DELETE /v1/reservations/:id`

### 트레이너
- `GET /v1/trainer/schedule?date=YYYY-MM-DD`
- `PATCH /v1/trainer/reservations/:id/approve`
- `PATCH /v1/trainer/reservations/:id/reject`
- `POST /v1/trainer/customers/:id/memo`
- `GET /v1/trainer/customers/:id/memos`

### 관리자
- `GET /v1/admin/dashboard`
- `GET /v1/admin/trainers`
- `POST /v1/admin/trainers`
- `PATCH /v1/admin/trainers/:id`
- `POST /v1/admin/slots/bulk`
- `PATCH /v1/admin/slots/:id/lock`
- `GET /v1/admin/stats?month=YYYY-MM`

---

## 7. 배포 방법

### 권장 배포 구조
- 프론트엔드: Vercel
- 백엔드: Render
- DB: Render PostgreSQL
- Redis: Render Redis 또는 Upstash

### 1) Render에 백엔드 배포
- Root Directory: `allgym-backend`
- Build Command: `npm install`
- Start Command: `npm run migrate && npm start`
- PostgreSQL, Redis 리소스를 먼저 생성
- 운영 환경변수 입력

### 2) Vercel에 프론트엔드 배포
- Root Directory: `allgym-frontend`
- Build Command: `npm run build`
- 환경변수: `NEXT_PUBLIC_API_BASE_URL=https://api.allgym.kr`

### 3) 도메인 연결
- 회원용 웹앱: `app.allgym.kr`
- 백엔드 API: `api.allgym.kr`

### 4) 카카오 설정
- Web 플랫폼: `https://app.allgym.kr`
- Redirect URI: `https://api.allgym.kr/v1/auth/kakao/callback`

### 5) 배포 후 확인
- `https://api.allgym.kr/health` 응답 확인
- `https://app.allgym.kr/login` 접속 확인
- 고객 예약 생성 확인
- 트레이너 승인/거절 확인
- 관리자 대시보드 확인

> 자세한 절차는 `DEPLOYMENT.md`를 참고하세요.

---

## 8. 운영 가이드

### 운영팀이 꼭 알아야 할 것
- 운영용 비밀값(`SESSION_SECRET`, `JWT_SECRET`, API 키)은 GitHub에 올리면 안 됩니다.
- 실제 `.env` 파일은 커밋 금지, `.env.example`만 유지합니다.
- 운영에서는 `COOKIE_SECURE=true` 설정을 권장합니다.
- 운영에서는 `ENABLE_KAKAO_FALLBACK=false`를 권장합니다.
- 샘플 데이터(`seed`)는 운영 최초 1회만 적용하는 것이 안전합니다.

### 장애 시 먼저 볼 것
- 로그인 문제: `KAKAO_REDIRECT_URI`, `WEB_BASE_URL`, 쿠키, HTTPS
- 세션 문제: `COOKIE_SECURE`, 도메인, CORS
- 예약 문제: PostgreSQL 연결, Redis 연결, 슬롯 상태
- 관리자 문제: 관리자 권한, API 응답, 데이터 상태

### 운영 점검 항목
- `/health` 정상 여부
- Render / Vercel 최근 배포 이력
- PostgreSQL / Redis 연결 상태
- 카카오 로그인 정상 여부
- 고객 / 트레이너 / 관리자 주요 흐름 정상 여부

> 운영 상세 문서는 `OPERATIONS-HANDOVER.md`를 참고하세요.

---

## 9. GitHub 업로드 시 주의사항

### 커밋하면 안 되는 것
- `.env`
- `.env.local`
- `.env.production`
- `node_modules/`
- `.next/`
- 로그 파일
- 인증서 / 키 파일

### 포함해야 하는 문서
- `README.md`
- `DEPLOYMENT.md`
- `OPERATIONS-HANDOVER.md`
- `CHANGELOG.md`
- `.gitignore`

### 권장 첫 커밋 메시지
```bash
git commit -m "feat: initialize ALLgym fullstack reservation system"
```

---

## 10. 관련 문서
- `DEPLOYMENT.md` : Vercel + Render 실제 배포 문서
- `OPERATIONS-HANDOVER.md` : 운영팀 인수인계 문서
- `CHANGELOG.md` : 버전 변경 이력

---

## 11. 라이선스 / 사용 범위
- 본 저장소는 ALLgym 내부 운영용 시스템 코드입니다.
- 외부 배포 및 재사용은 별도 협의 후 진행합니다.

---

## 빠르게 시작하기
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL> allgym-fullstack
cd allgym-fullstack
cp allgym-backend/.env.example allgym-backend/.env
cp allgym-frontend/.env.example allgym-frontend/.env.local
npm install
npm run install:all
npm run docker:up
npm run migrate
npm run seed
npm run dev
```

서비스 오픈 후 회원은 아래 주소로 접속합니다.
- `https://app.allgym.kr`
