# ALLgym GitHub 첫 업로드 / 커밋 / 태그 / 릴리즈 가이드

이 문서는 **ALLgym GitHub 저장소 첫 업로드 시 필요한 커밋 메시지, 태그 전략, 릴리즈 절차**를 한 번에 정리한 운영용 기준 문서입니다.

대상 독자:
- 개발팀
- 운영팀
- 외주 인수인계 담당자
- PM / 배포 담당자

---

## 1. 목적

이 문서의 목적은 아래 3가지를 표준화하는 것입니다.

1. GitHub 첫 업로드 시 어떤 커밋 메시지를 써야 하는지 정리
2. 버전 태그(`v1.0.0` 등)를 어떤 기준으로 붙일지 정리
3. GitHub Release를 어떤 순서로 생성할지 정리

즉, 저장소를 처음 올릴 때부터 **버전 관리 방식이 뒤죽박죽 되지 않도록** 기준을 잡는 문서입니다.

---

## 2. 기본 원칙

### 저장소 기준
- 저장소명: `allgym-fullstack`
- 기본 브랜치: `main`
- 첫 배포 가능 버전 태그: `v1.0.0`

### 버전 표기 원칙
- `v1.0.0` : 첫 배포 가능 버전
- `v1.0.1` : 작은 버그 수정
- `v1.1.0` : 기능 추가
- `v2.0.0` : 큰 구조 변경 / 호환성 변경

### 커밋 메시지 원칙
가능하면 **Conventional Commits** 형식을 사용합니다.

형식:
```text
<type>: <summary>
```

예시:
```text
feat: initialize ALLgym fullstack reservation system
fix: update Kakao redirect URI for production
chore: rename project folders to allgym convention
docs: add ALLgym deployment and operations guide
```

---

## 3. 권장 커밋 타입

| 타입 | 의미 | 예시 |
|---|---|---|
| `feat` | 기능 추가 | `feat: add trainer approval API` |
| `fix` | 버그 수정 | `fix: resolve session cookie issue on production` |
| `docs` | 문서 변경 | `docs: update README for ALLgym branding` |
| `chore` | 설정/구조/의존성 정리 | `chore: prepare repository for GitHub release` |
| `refactor` | 동작은 같고 구조만 개선 | `refactor: simplify reservation lock flow` |
| `test` | 테스트 추가/수정 | `test: add reservation smoke test cases` |
| `build` | 빌드 설정 변경 | `build: update frontend build configuration` |
| `ci` | CI/CD 설정 | `ci: add GitHub Actions deployment workflow` |

---

## 4. 첫 업로드용 권장 커밋 메시지

### 가장 추천하는 1회 업로드 메시지
```bash
git commit -m "feat: initialize ALLgym fullstack reservation system"
```

이 메시지는 아래 의미를 포함합니다.
- ALLgym 프로젝트 초기 구조 업로드
- 프론트/백엔드/문서/배포 설정 포함
- 첫 배포 가능 상태의 기준 커밋

### 문서를 포함해 조금 더 나누고 싶을 때
#### 1차: 코드 구조 업로드
```bash
git commit -m "feat: add ALLgym backend and frontend base structure"
```

#### 2차: 문서 추가
```bash
git commit -m "docs: add ALLgym README deployment and operations docs"
```

#### 3차: GitHub 업로드 준비
```bash
git commit -m "chore: prepare repository for initial GitHub release"
```

---

## 5. 첫 업로드 절차

### 1) Git 초기화
```bash
git init
git branch -M main
```

### 2) 파일 추가
```bash
git add .
```

### 3) 첫 커밋
```bash
git commit -m "feat: initialize ALLgym fullstack reservation system"
```

### 4) 원격 저장소 연결
```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/allgym-fullstack.git
```

### 5) 푸시
```bash
git push -u origin main
```

---

## 6. 태그 전략

### 첫 태그
첫 릴리즈 태그는 아래를 사용합니다.

```text
v1.0.0
```

### 왜 `v1.0.0`인가?
이 버전은 아래 조건을 만족하는 **첫 배포 가능 버전**이기 때문입니다.
- 프론트엔드 포함
- 백엔드 포함
- 예약 생성/취소 포함
- 트레이너 승인/거절 포함
- 관리자 운영 기능 포함
- 배포 문서 포함
- 운영 인수인계 문서 포함

### 다음 태그 규칙
| 상황 | 권장 태그 |
|---|---|
| 오타/문서/작은 수정 | `v1.0.1` |
| 기능 추가 | `v1.1.0` |
| 구조 개편/호환성 변경 | `v2.0.0` |

---

## 7. 태그 생성 명령어

### 첫 릴리즈 태그 생성
```bash
git tag -a v1.0.0 -m "ALLgym initial deployable release"
git push origin v1.0.0
```

### 태그 확인
```bash
git tag
```

### 특정 태그 상세 확인
```bash
git show v1.0.0
```

---

## 8. GitHub Release 제목 권장안

### 영문 제목
```text
v1.0.0 - ALLgym reservation system initial deployable release
```

### 한글 제목
```text
v1.0.0 - ALLgym 예약 시스템 첫 배포 가능 버전
```

둘 중 하나를 선택해서 사용하면 됩니다.

---

## 9. GitHub Release 본문 권장안

### 영문 버전
```md
## ALLgym v1.0.0

Initial deployable release of the ALLgym reservation management system.

### Included
- Next.js frontend for customer, trainer, and admin roles
- Express backend with PostgreSQL and Redis integration
- Phone verification and Kakao login flow
- Reservation creation, cancellation, trainer approval/rejection
- Admin dashboard, trainer management, slot lock/unlock, monthly stats
- Deployment guide for Vercel + Render
- Operations handover documentation

### Production Domain Plan
- Web: https://app.allgym.kr
- API: https://api.allgym.kr
- Kakao Redirect URI: https://api.allgym.kr/v1/auth/kakao/callback

### Notes
- Replace production secrets before deployment
- Do not commit real .env files
- Run seed data only once in the first production setup
```

### 한국어 버전
```md
## ALLgym v1.0.0

ALLgym 예약 관리 시스템의 첫 번째 배포 가능 버전입니다.

### 포함 내용
- 고객 / 트레이너 / 관리자 웹앱
- Express + PostgreSQL + Redis 기반 백엔드 API
- 전화번호 인증 및 카카오 로그인 흐름
- 예약 생성 / 취소 / 트레이너 승인·거절
- 관리자 대시보드 / 트레이너 관리 / 슬롯 잠금 / 월별 통계
- Vercel + Render 배포 문서
- 운영팀 인수인계 문서

### 운영 주소 계획
- 회원용 웹앱: https://app.allgym.kr
- 백엔드 API: https://api.allgym.kr
- 카카오 Redirect URI: https://api.allgym.kr/v1/auth/kakao/callback

### 주의사항
- 운영 비밀값은 실제 값으로 교체 후 배포
- 실제 .env 파일은 GitHub에 커밋 금지
- 샘플 데이터는 운영 최초 세팅 시 1회만 적용 권장
```

---

## 10. GitHub Release 생성 절차

### 1) main 브랜치 최신화
```bash
git checkout main
git pull origin main
```

### 2) 변경사항 커밋
```bash
git add .
git commit -m "docs: finalize ALLgym release preparation"
git push origin main
```

### 3) 태그 생성
```bash
git tag -a v1.0.0 -m "ALLgym initial deployable release"
git push origin v1.0.0
```

### 4) GitHub 웹에서 Release 생성
GitHub 저장소에서 아래 순서로 진행합니다.
- **Releases** 메뉴 클릭
- **Draft a new release** 클릭
- **Choose a tag** 에서 `v1.0.0` 선택
- 제목 입력
- 릴리즈 노트 본문 붙여넣기
- **Publish release** 클릭

---

## 11. 첫 릴리즈 전에 꼭 확인할 체크리스트

| 항목 | 확인 |
|---|---|
| README가 ALLgym 기준으로 최신화됨 | ☐ |
| DEPLOYMENT 문서 최신화됨 | ☐ |
| OPERATIONS-HANDOVER 문서 최신화됨 | ☐ |
| CHANGELOG 작성됨 | ☐ |
| `.gitignore` 적용됨 | ☐ |
| 실제 `.env` 파일이 Git에서 제외됨 | ☐ |
| `main` 브랜치 기준 커밋 완료 | ☐ |
| 태그 `v1.0.0` 생성 완료 | ☐ |
| Release 본문 준비 완료 | ☐ |

---

## 12. 운영팀 관점에서 중요한 점

운영팀은 GitHub Release를 단순 공지로 보면 안 됩니다.
Release는 아래 기준점 역할을 합니다.
- 어떤 시점의 코드를 운영에 배포했는지 기록
- 어떤 문서 버전이 같이 배포됐는지 기록
- 장애 시 어느 버전으로 롤백해야 하는지 기준 제공

즉, 운영 배포 전에는 반드시 **태그와 릴리즈를 기준 버전으로 남겨두는 것**이 좋습니다.

---

## 13. 가장 추천하는 최종 조합

### 첫 커밋 메시지
```text
feat: initialize ALLgym fullstack reservation system
```

### 첫 태그
```text
v1.0.0
```

### 첫 릴리즈 제목
```text
v1.0.0 - ALLgym reservation system initial deployable release
```

### 태그 생성 명령어
```bash
git tag -a v1.0.0 -m "ALLgym initial deployable release"
git push origin v1.0.0
```

---

## 14. 한 번에 보는 복붙용 명령어

```bash
git init
git branch -M main
git add .
git commit -m "feat: initialize ALLgym fullstack reservation system"
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/allgym-fullstack.git
git push -u origin main
git tag -a v1.0.0 -m "ALLgym initial deployable release"
git push origin v1.0.0
```

이 명령어를 실행한 뒤 GitHub 웹에서 Release만 생성하면 첫 업로드 + 첫 릴리즈가 완료됩니다.
