'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/top-nav';
import { api, Branch, formatDate, SessionUser, Slot } from '@/lib/api';

function slotClass(status: Slot['status'], selected: boolean) {
  if (selected) return 'slot-btn border-oljim-black bg-oljim-black text-white';
  if (status === 'OPEN') return 'slot-btn border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-500';
  if (status === 'LOCKED') return 'slot-btn border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'BLOCKED') return 'slot-btn border-red-200 bg-red-50 text-red-700';
  return 'slot-btn border-oljim-line bg-gray-50 text-gray-400';
}

export default function CustomerPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [creating, setCreating] = useState(false);

  const dates = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const refreshReservations = async () => {
    try {
      const data = await api.getMyReservations();
      setReservations(data);
    } catch {
      setReservations([]);
    }
  };

  const refreshSlots = async (branchId: string, date: string) => {
    setLoadingSlots(true);
    try {
      const data = await api.getBranchSlots(branchId, date);
      setSlots(data);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    api.getMe().then((res) => {
      if (!res.user) return router.replace('/login');
      setUser(res.user);
    });
    api.getBranches().then((data) => {
      setBranches(data);
      if (data[0]) setSelectedBranch(data[0]);
    });
    refreshReservations();
  }, [router]);

  useEffect(() => {
    if (!selectedBranch) return;
    refreshSlots(selectedBranch.id, selectedDate);
  }, [selectedBranch, selectedDate]);

  const handleChooseSlot = async (slot: Slot) => {
    if (slot.status !== 'OPEN') return;
    try {
      await api.lockSlot(slot.id);
      setSelectedSlot(slot);
      setMessage(`선택 완료: ${selectedDate} ${slot.start.slice(0, 5)} (${selectedBranch?.name})`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '슬롯 잠금 실패');
    }
  };

  const handleCreateReservation = async () => {
    if (!selectedSlot) return;
    try {
      setCreating(true);
      await api.createReservation(selectedSlot.id);
      setMessage('예약이 완료되었습니다. 카카오 알림톡 발송 단계로 연결할 수 있습니다.');
      setSelectedSlot(null);
      await refreshReservations();
      if (selectedBranch) await refreshSlots(selectedBranch.id, selectedDate);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '예약 생성 실패');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    try {
      const result = await api.cancelReservation(reservationId);
      setMessage(result.penalty ? '2시간 이내 취소로 패널티 대상입니다.' : '예약이 정상 취소되었습니다.');
      await refreshReservations();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '취소 실패');
    }
  };

  return (
    <main className="page-shell">
      <TopNav user={user} />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <div className="card">
            <div className="text-sm text-oljim-muted">1단계</div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">지점 선택</h1>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {branches.map((branch) => {
                const selected = selectedBranch?.id === branch.id;
                return (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedBranch(branch)}
                    className={selected ? 'card border-oljim-black text-left' : 'card text-left'}
                    type="button"
                  >
                    <div className="text-lg font-bold">{branch.name}</div>
                    <div className="mt-2 text-sm text-oljim-muted">{branch.location}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-oljim-muted">2단계</div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">날짜 선택</h2>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {dates.map((date) => {
                const value = formatDate(date);
                const selected = value === selectedDate;
                return (
                  <button
                    key={value}
                    onClick={() => setSelectedDate(value)}
                    className={selected ? 'min-w-20 rounded-2xl bg-oljim-black px-4 py-3 text-white' : 'min-w-20 rounded-2xl border border-oljim-line px-4 py-3'}
                    type="button"
                  >
                    <div className="text-xs opacity-70">
                      {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-bold">{date.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="text-sm text-oljim-muted">3단계</div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">시간 선택</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-oljim-muted">
              <span>🟢 예약 가능</span>
              <span>🟠 잠금 중</span>
              <span>🔴 관리자 차단</span>
              <span>⚪ 마감</span>
            </div>
            {loadingSlots ? (
              <div className="mt-4 text-sm text-oljim-muted">슬롯 불러오는 중...</div>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={slot.status !== 'OPEN'}
                    onClick={() => handleChooseSlot(slot)}
                    className={slotClass(slot.status, selectedSlot?.id === slot.id)}
                  >
                    <div>{slot.start.slice(0, 5)}</div>
                    <div className="text-[11px] font-medium opacity-80">{slot.trainerName || '트레이너 미배정'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-xl font-bold">예약 확인</h2>
            <div className="rounded-2xl bg-oljim-soft p-4 text-sm text-oljim-muted">
              <div>지점: {selectedBranch?.name || '-'}</div>
              <div>날짜: {selectedDate}</div>
              <div>시간: {selectedSlot ? selectedSlot.start.slice(0, 5) : '-'}</div>
            </div>
            <div className="text-sm text-oljim-muted">취소 정책: 시작 2시간 전까지 무료 취소</div>
            <button className="btn-primary w-full" onClick={handleCreateReservation} disabled={!selectedSlot || creating}>
              {creating ? '예약 생성 중...' : '예약 확정'}
            </button>
            {message ? <div className="rounded-2xl bg-oljim-soft p-3 text-sm text-oljim-muted">{message}</div> : null}
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold">내 예약</h2>
              <button className="text-sm font-semibold text-oljim-muted" onClick={refreshReservations} type="button">
                새로고침
              </button>
            </div>
            <div className="space-y-3">
              {reservations.length === 0 ? (
                <div className="rounded-2xl bg-oljim-soft p-4 text-sm text-oljim-muted">예약 내역이 없습니다.</div>
              ) : (
                reservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-2xl border border-oljim-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{reservation.branch_name}</div>
                        <div className="mt-1 text-sm text-oljim-muted">
                          {String(reservation.slot_date).slice(0, 10)} · {reservation.start_time?.slice(0, 5)}
                        </div>
                        <div className="mt-1 text-sm text-oljim-muted">트레이너: {reservation.trainer_name || '미배정'}</div>
                      </div>
                      <span className="rounded-full bg-oljim-soft px-3 py-1 text-xs font-semibold text-oljim-muted">
                        {reservation.status}
                      </span>
                    </div>
                    {['PENDING', 'CONFIRMED'].includes(reservation.status) ? (
                      <button className="btn-secondary mt-3 w-full" onClick={() => handleCancel(reservation.id)} type="button">
                        예약 취소
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
