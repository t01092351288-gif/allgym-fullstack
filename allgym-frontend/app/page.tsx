'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopNav from '@/components/top-nav';
import { api, rolePath, SessionUser } from '@/lib/api';

export default function HomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe().then((res) => setUser(res.user)).finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <TopNav user={user} />

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="card space-y-4">
          <div className="inline-flex rounded-full bg-oljim-soft px-3 py-1 text-sm font-medium text-oljim-muted">
            실서비스 전환용 Next.js 프론트엔드
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">올짐 예약 웹앱 시작 페이지</h1>
          <p className="text-base text-oljim-muted">
            현재 프론트엔드는 백엔드 API와 실제 통신하도록 구성되어 있습니다. 고객 예약, 트레이너 승인/메모,
            관리자 대시보드와 슬롯 관리까지 모두 연결할 수 있도록 설계했습니다.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Link className="card transition hover:-translate-y-0.5 hover:border-oljim-black" href={user ? rolePath(user.role) : '/login'}>
              <div className="text-sm text-oljim-muted">고객</div>
              <div className="mt-2 text-xl font-bold">예약 3단계</div>
              <div className="mt-2 text-sm text-oljim-muted">지점 → 날짜 → 시간 → 예약 완료</div>
            </Link>
            <Link className="card transition hover:-translate-y-0.5 hover:border-oljim-black" href={user ? '/trainer' : '/login'}>
              <div className="text-sm text-oljim-muted">트레이너</div>
              <div className="mt-2 text-xl font-bold">일정 관리</div>
              <div className="mt-2 text-sm text-oljim-muted">승인/거절, 고객 메모, 일자별 스케줄</div>
            </Link>
            <Link className="card transition hover:-translate-y-0.5 hover:border-oljim-black" href={user ? '/admin' : '/login'}>
              <div className="text-sm text-oljim-muted">관리자</div>
              <div className="mt-2 text-xl font-bold">통합 운영</div>
              <div className="mt-2 text-sm text-oljim-muted">대시보드, 트레이너, 슬롯 잠금, 통계</div>
            </Link>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-xl font-bold">현재 상태</h2>
          {loading ? (
            <div className="text-sm text-oljim-muted">세션 확인 중...</div>
          ) : user ? (
            <>
              <div className="rounded-2xl bg-oljim-soft p-4">
                <div className="text-sm text-oljim-muted">로그인 사용자</div>
                <div className="mt-1 text-lg font-bold">{user.name}</div>
                <div className="text-sm text-oljim-muted">권한: {user.role}</div>
              </div>
              <Link className="btn-primary w-full" href={rolePath(user.role)}>
                현재 권한으로 바로 이동
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-oljim-muted">로그인 후 권한별 화면으로 이동할 수 있습니다.</p>
              <Link className="btn-primary w-full" href="/login">
                로그인 시작
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
