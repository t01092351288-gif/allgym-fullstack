# 올짐 피트니스 예약 시스템 배포 문서

이 문서는 올짐 피트니스 예약 시스템을 **운영 환경에 배포**하기 위한 표준 배포 문서입니다.
대상 독자는 운영팀, 인프라 담당자, 외주 개발사, PM입니다.

---

## 1. 배포 목표

배포 목표는 다음 4가지를 만족하는 것입니다.
1. 고객/트레이너/관리자 웹앱이 HTTPS 환경에서 정상 동작할 것
2. 세션 쿠키 인증이 프론트 ↔ 백엔드 간 유지될 것
3. PostgreSQL / Redis 연결이 안정적으로 유지될 것
4. 카카오 로그인 Redirect URI 및 운영 도메인이 정확히 연결될 것

---

## 2. 권장 운영 아키텍처

```text
사용자 브라우저
   ↓
Vercel (Next.js 프론트엔드, app.oljim.kr)
   ↓ API 호출 (credentials: include)
Render (Express 백엔드, api.oljim.kr)
   ↓
Render PostgreSQL
   ↓
Render Redis 또는 Upstash Redis
```

권장 도메인 예시:
- 프론트엔드: `https://app.oljim.kr`
- 백엔드 API: `https://api.oljim.kr`

---

## 3. 배포 전 준비물

### 계정/서비스
- GitHub 저장소
- Vercel 프로젝트 권한
- Render 프로젝트 권한
- Kakao Developers 권한
- DNS 관리 권한

### 필수 비밀값
- `SESSION_SECRET`
- `JWT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `KAKAO_REST_API_KEY`

### 참고 파일
- 백엔드 운영 env 예시: `allgym-backend/.env.production.example`
- Render 설정 예시: `allgym-backend/render.yaml`
- Vercel 설정 예시: `allgym-frontend/vercel.json`

---

## 4. GitHub 업로드 기준

### 업로드 대상
저장소 루트 기준 아래 구조가 유지되어야 합니다.

```text
allgym-fullstack/
├── allgym-backend/
├── allgym-frontend/
├── README.md
├── DEPLOYMENT.md
└── OPERATIONS-HANDOVER.md
```

### 업로드 제외 대상
다음 항목은 커밋하지 않습니다.
- `node_modules/`
- `.next/`
- `*.log`
- 실제 `.env`
- 운영 비밀키가 포함된 파일

### 권장 브랜치 전략
- `main`: 운영 배포 기준 브랜치
- `develop`: 통합 개발 브랜치
- `feature/*`: 기능 단위 브랜치
- `hotfix/*`: 운영 긴급 수정 브랜치

---

## 5. 프론트엔드 배포 절차 (Vercel)

### 5.1 기본 설정
- Framework Preset: **Next.js**
- Root Directory: `allgym-frontend`
- Install Command: `npm install`
- Build Command: `npm run build`

### 5.2 환경변수
Vercel 환경변수에 아래 값을 입력합니다.

```env
NEXT_PUBLIC_API_BASE_URL=https://api.oljim.kr
```

### 5.3 도메인 연결
- Vercel 프로젝트에 `app.oljim.kr` 연결
- HTTPS 인증서 발급 완료 확인

### 5.4 배포 후 점검
- `/login` 접속 확인
- `/customer` 리다이렉트/권한 흐름 확인
- 카카오 로그인 버튼 클릭 시 백엔드 `/v1/auth/kakao`로 이동하는지 확인

---

## 6. 백엔드 배포 절차 (Render)

### 6.1 리소스 생성 순서
1. PostgreSQL 생성
2. Redis 생성
3. Web Service 생성

### 6.2 Web Service 설정
- Root Directory: `allgym-backend`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm run migrate && npm start`

> 초기 샘플 데이터가 필요하면 운영 최초 1회만 `npm run seed`를 별도로 실행합니다.

### 6.3 운영 환경변수
아래 값을 Render 환경변수에 입력합니다.

```env
NODE_ENV=production
PORT=4000
APP_BASE_URL=https://api.oljim.kr
WEB_BASE_URL=https://app.oljim.kr
DATABASE_URL=<Render PostgreSQL 연결 문자열>
REDIS_URL=<Render Redis 연결 문자열>
PGSSL=true
COOKIE_SECURE=true
COOKIE_DOMAIN=
SESSION_SECRET=<긴 랜덤 문자열>
JWT_SECRET=<긴 랜덤 문자열>
JWT_EXPIRES_IN=7d
KAKAO_REST_API_KEY=<카카오 REST API KEY>
KAKAO_REDIRECT_URI=https://api.oljim.kr/v1/auth/kakao/callback
ENABLE_KAKAO_FALLBACK=false
COOLSMS_API_KEY=
COOLSMS_API_SECRET=
KAKAO_BIZ_SENDER_KEY=
```

### 6.4 운영 정책
- 운영에서는 `ENABLE_KAKAO_FALLBACK=false` 권장
- HTTPS 미적용 환경에서 `COOKIE_SECURE=true` 상태면 로그인 세션이 유지되지 않을 수 있음
- `WEB_BASE_URL` 값은 프론트 실제 도메인과 반드시 일치해야 함

---

## 7. 카카오 로그인 운영 설정

### 7.1 Kakao Developers 설정
#### Web 플랫폼
- `https://app.oljim.kr`

#### Redirect URI
- `https://api.oljim.kr/v1/auth/kakao/callback`

#### 권장 동의 항목
- 프로필 정보(닉네임)
- 필요 시 전화번호

### 7.2 주의사항
- 카카오 Redirect URI는 오타 1자만 있어도 로그인 실패
- 프론트 도메인과 백엔드 Redirect URI는 모두 운영 환경 기준으로 등록
- 로컬/스테이징/운영을 함께 관리하면 각각 별도 URI 등록 권장

---

## 8. DNS / 도메인 연결

### 권장 서브도메인
- `app.oljim.kr` → Vercel
- `api.oljim.kr` → Render

### 연결 완료 후 확인
- `https://app.oljim.kr` 접속 가능
- `https://api.oljim.kr/health` 응답 가능
- 브라우저 보안 경고 없음

---

## 9. 운영 배포 체크리스트

| 항목 | 확인 |
|---|---|
| GitHub 저장소 최신 코드 반영 | ☐ |
| Vercel Root Directory = `allgym-frontend` | ☐ |
| Render Root Directory = `allgym-backend` | ☐ |
| `NEXT_PUBLIC_API_BASE_URL` 운영 주소 반영 | ☐ |
| `WEB_BASE_URL` 운영 프론트 주소 반영 | ☐ |
| `APP_BASE_URL` 운영 백엔드 주소 반영 | ☐ |
| PostgreSQL 연결 성공 | ☐ |
| Redis 연결 성공 | ☐ |
| `COOKIE_SECURE=true` 반영 | ☐ |
| 카카오 Web 플랫폼 등록 완료 | ☐ |
| 카카오 Redirect URI 등록 완료 | ☐ |
| `/health` 정상 응답 | ☐ |
| 고객 예약 생성 테스트 성공 | ☐ |
| 트레이너 승인/거절 테스트 성공 | ☐ |
| 관리자 슬롯 잠금/통계 테스트 성공 | ☐ |

---

## 10. 배포 후 스모크 테스트

### 고객
1. `/login` 접속
2. 전화번호 로그인 또는 카카오 로그인 성공
3. 지점/날짜/시간 선택
4. 예약 생성 성공
5. 내 예약 목록 확인
6. 예약 취소 성공

### 트레이너
1. 트레이너 계정 로그인
2. `/trainer` 진입
3. 일정 조회 성공
4. 예약 승인 또는 거절 성공
5. 고객 메모 저장/조회 성공

### 관리자
1. 관리자 계정 로그인
2. `/admin` 진입
3. 대시보드 수치 조회 성공
4. 트레이너 목록 조회/수정 성공
5. 슬롯 잠금/해제 성공
6. 월별 통계 조회 성공

---

## 11. 장애 대응 우선순위

| 증상 | 1차 확인 | 2차 확인 | 3차 확인 |
|---|---|---|---|
| 로그인 실패 | 카카오 Redirect URI | `WEB_BASE_URL` | 쿠키/HTTPS |
| 세션 유지 안 됨 | `COOKIE_SECURE` | HTTPS 적용 여부 | CORS 설정 |
| 예약 생성 실패 | PostgreSQL 연결 | Redis 연결 | 슬롯 상태/중복 예약 |
| 프론트 API 실패 | `NEXT_PUBLIC_API_BASE_URL` | Render 상태 | 브라우저 콘솔 |
| 관리자 페이지 오류 | 관리자 권한 계정 | API 응답 | DB 데이터 |

---

## 12. 롤백 기준

다음 상황에서는 즉시 직전 안정 버전으로 롤백합니다.
- 고객 로그인 실패가 지속될 때
- 예약 생성이 불가능할 때
- 세션 유지가 전면적으로 깨질 때
- 관리자 기능에서 슬롯 상태 오작동이 발생할 때

### 롤백 절차
1. Vercel에서 직전 배포 버전 재배포
2. Render에서 직전 Git 커밋 기준 재배포
3. `/health` 및 핵심 시나리오 재검증
4. 장애 공지 및 원인 분석 기록

---

## 13. 배포 완료 기준

아래 조건을 모두 만족하면 운영 배포 완료로 판단합니다.
- 프론트/백엔드 도메인 HTTPS 정상
- 로그인, 예약, 승인, 취소, 관리자 기능 모두 정상
- 카카오 로그인 Redirect URI 검증 완료
- 운영팀 체크리스트 완료
- 인수인계 문서 공유 완료

---

## 14. 함께 봐야 할 문서

- `README.md` : 저장소 개요 및 로컬 실행
- `OPERATIONS-HANDOVER.md` : 운영팀 인수인계 문서
