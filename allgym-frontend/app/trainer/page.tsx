'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/top-nav';
import { api, formatDate, SessionUser } from '@/lib/api';

export default function TrainerPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [date, setDate] = useState(formatDate(new Date()));
  const [schedule, setSchedule] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [memoCustomerId, setMemoCustomerId] = useState<string>('');
  const [memoContent, setMemoContent] = useState('');
  const [memos, setMemos] = useState<any[]>([]);

  const loadSchedule = async (targetDate: string) => {
    try {
      const data = await api.getTrainerSchedule(targetDate);
      setSchedule(data.filter((item) => item.reservation_id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '일정 조회 실패');
    }
  };

  useEffect(() => {
    api.getMe().then((res) => {
      if (!res.user) return router.replace('/login');
      setUser(res.user);
    });
  }, [router]);

  useEffect(() => {
    loadSchedule(date);
  }, [date]);

  const handleApprove = async (reservationId: string) => {
    await api.approveReservation(reservationId);
    setMessage('예약을 승인했습니다.');
    loadSchedule(date);
  };

  const handleReject = async (reservationId: string) => {
    await api.rejectReservation(reservationId, '트레이너 일정 사정으로 거절');
    setMessage('예약을 거절했습니다.');
    loadSchedule(date);
  };

  const openMemo = async (customerId: string) => {
    setMemoCustomerId(customerId);
    setMemoContent('');
    const result = await api.getMemos(customerId);
    setMemos(result);
  };

  const saveMemo = async () => {
    if (!memoCustomerId || !memoContent.trim()) return;
    await api.createMemo(memoCustomerId, memoContent.trim());
    setMessage('고객 메모를 저장했습니다.');
    const result = await api.getMemos(memoCustomerId);
    setMemos(result);
    setMemoContent('');
  };

  const pendingCount = schedule.filter((x) => x.status === 'PENDING').length;
  const confirmedCount = schedule.filter((x) => x.status === 'CONFIRMED').length;

  return (
    <main className="page-shell">
      <TopNav user={user} />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <section className="space-y-4">
          <div className="card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-oljim-muted">트레이너 일정 관리</div>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">오늘의 예약 스케줄</h1>
            </div>
            <input className="input max-w-52" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card">
              <div className="text-sm text-oljim-muted">승인 대기</div>
              <div className="mt-2 text-3xl font-extrabold">{pendingCount}</div>
            </div>
            <div className="card">
              <div className="text-sm text-oljim-muted">확정 예약</div>
              <div className="mt-2 text-3xl font-extrabold">{confirmedCount}</div>
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="text-xl font-bold">시간표</h2>
            {schedule.length === 0 ? (
              <div className="rounded-2xl bg-oljim-soft p-4 text-sm text-oljim-muted">선택한 날짜의 예약이 없습니다.</div>
            ) : (
              schedule.map((item) => (
                <div key={item.reservation_id} className="rounded-2xl border border-oljim-line p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-bold">{item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}</div>
                      <div className="mt-1 text-sm text-oljim-muted">회원: {item.customer_name} · {item.customer_phone}</div>
                    </div>
                    <span className="rounded-full bg-oljim-soft px-3 py-1 text-xs font-semibold text-oljim-muted">{item.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.status === 'PENDING' ? (
                      <>
                        <button className="btn-primary" onClick={() => handleApprove(item.reservation_id)} type="button">승인</button>
                        <button className="btn-secondary" onClick={() => handleReject(item.reservation_id)} type="button">거절</button>
                      </>
                    ) : null}
                    <button className="btn-secondary" onClick={() => openMemo(item.customer_id)} type="button">고객 메모</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="card space-y-3">
          <h2 className="text-xl font-bold">고객 메모</h2>
          <p className="text-sm text-oljim-muted">고객을 선택한 뒤 운동 기록이나 특이사항을 남길 수 있습니다.</p>
          <textarea
            className="input min-h-28 resize-none"
            placeholder="예: 어깨 가동성 주의, 허리 통증 체크 필요"
            value={memoContent}
            onChange={(e) => setMemoContent(e.target.value)}
          />
          <button className="btn-primary w-full" type="button" onClick={saveMemo} disabled={!memoCustomerId || !memoContent.trim()}>
            메모 저장
          </button>
          {message ? <div className="rounded-2xl bg-oljim-soft p-3 text-sm text-oljim-muted">{message}</div> : null}
          <div className="space-y-2 pt-2">
            {memos.length === 0 ? (
              <div className="rounded-2xl bg-oljim-soft p-4 text-sm text-oljim-muted">선택된 고객 메모가 없습니다.</div>
            ) : (
              memos.map((memo) => (
                <div key={memo.id} className="rounded-2xl border border-oljim-line p-3 text-sm">
                  <div>{memo.content}</div>
                  <div className="mt-2 text-xs text-oljim-muted">{new Date(memo.created_at).toLocaleString('ko-KR')}</div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
