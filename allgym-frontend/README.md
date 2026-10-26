# 올짐 피트니스 프론트엔드 (Next.js)

올짐 피트니스 예약 관리 시스템의 **실서비스 전환용 웹앱 프론트엔드**입니다.
기존 Express + PostgreSQL + Redis 백엔드와 실제로 통신하도록 구성되어 있습니다.

## 기술 스택
- Next.js 15
- TypeScript
- Tailwind CSS
- 세션쿠키 기반 인증 (`credentials: include`)

## 실행 방법

```bash
cd allgym-frontend
cp .env.example .env.local
npm install
npm run dev
```

기본 실행 주소:
- 프론트엔드: `http://localhost:3000`
- 백엔드 API: `http://localhost:4000`

`.env.local` 예시:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## 주요 페이지
- `/` 시작 페이지
- `/login` 로그인 (카카오 / 전화번호 인증)
- `/login/callback` 카카오 로그인 콜백 처리
- `/customer` 고객 예약 화면
- `/trainer` 트레이너 일정 / 승인 / 메모
- `/admin` 관리자 대시보드 / 트레이너 / 슬롯 / 통계

## 백엔드 연동 포인트
- 카카오 로그인: `GET /v1/auth/kakao`
- 전화번호 인증: `POST /v1/auth/phone/send`, `POST /v1/auth/phone/verify`
- 세션 확인: `GET /v1/auth/me`
- 예약: `/v1/branches`, `/v1/slots/:id/lock`, `/v1/reservations`
- 트레이너: `/v1/trainer/*`
- 관리자: `/v1/admin/*`

## 실서비스 배포 팁
- 프론트엔드는 **Vercel** 권장
- 백엔드는 **Render** 권장
- 백엔드 `WEB_BASE_URL` 과 프론트 `NEXT_PUBLIC_API_BASE_URL` 을 서로 맞춰주세요
- 카카오 Redirect URI 예시:
  - 로컬: `http://localhost:4000/v1/auth/kakao/callback`
  - 운영: `https://api.oljim.kr/v1/auth/kakao/callback`

## 다음 권장 작업
1. 서버 컴포넌트 + 미들웨어 기반 권한 보호 추가
2. 예약 완료/실패 토스트 컴포넌트 공통화
3. 관리자 슬롯 공지/사유 입력 기능 확장
4. React Query 또는 SWR 적용
5. 디자인 시스템 컴포넌트 분리
