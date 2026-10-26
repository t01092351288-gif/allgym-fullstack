'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/top-nav';
import { api, Branch, formatDate, SessionUser } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [slotDate, setSlotDate] = useState(formatDate(new Date()));
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branchSlots, setBranchSlots] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', branchId: '', bio: '' });

  const loadAll = async (branchId?: string) => {
    const [branchData, dashboardData, trainerData, statsData] = await Promise.all([
      api.getBranches(),
      api.getAdminDashboard(),
      api.getAdminTrainers(),
      api.getAdminStats(month),
    ]);
    setBranches(branchData);
    setDashboard(dashboardData);
    setTrainers(trainerData);
    setStats(statsData);

    const activeBranchId = branchId || selectedBranchId || branchData[0]?.id || '';
    if (activeBranchId) {
      setSelectedBranchId(activeBranchId);
      const slots = await api.getBranchSlots(activeBranchId, slotDate);
      setBranchSlots(slots);
    }
  };

  useEffect(() => {
    api.getMe().then((res) => {
      if (!res.user) return router.replace('/login');
      setUser(res.user);
    });
  }, [router]);

  useEffect(() => {
    loadAll().catch((error) => setMessage(error instanceof Error ? error.message : '관리자 데이터 조회 실패'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, slotDate]);

  const createTrainer = async () => {
    try {
      await api.createAdminTrainer(form);
      setMessage('트레이너를 등록했습니다.');
      setForm({ name: '', phone: '', branchId: selectedBranchId || '', bio: '' });
      await loadAll(selectedBranchId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '트레이너 등록 실패');
    }
  };

  const toggleTrainer = async (trainer: any) => {
    try {
      await api.updateAdminTrainer(trainer.id, { isActive: !trainer.is_active });
      setMessage(trainer.is_active ? '트레이너를 비활성화했습니다.' : '트레이너를 활성화했습니다.');
      await loadAll(selectedBranchId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '트레이너 상태 변경 실패');
    }
  };

  const toggleSlot = async (slotId: string, locked: boolean) => {
    try {
      await api.setSlotLocked(slotId, locked);
      setMessage(locked ? '슬롯을 잠금 처리했습니다.' : '슬롯 잠금을 해제했습니다.');
      const slots = await api.getBranchSlots(selectedBranchId, slotDate);
      setBranchSlots(slots);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '슬롯 상태 변경 실패');
    }
  };

  const maxPopular = Math.max(1, ...(stats?.popular || []).map((item: any) => item.cnt));
  const maxConfirmed = Math.max(1, ...(stats?.monthly || []).map((item: any) => item.confirmed));

  return (
    <main className="page-shell">
      <TopNav user={user} />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div className="card">
            <div className="text-sm text-oljim-muted">통합 운영 현황</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">관리자 대시보드</h1>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {(dashboard?.byBranch || []).map((branch: any) => (
                <div key={branch.id} className="rounded-2xl border border-oljim-line p-4">
                  <div className="text-sm text-oljim-muted">{branch.name}</div>
                  <div className="mt-2 text-3xl font-extrabold">{branch.today_count}</div>
                  <div className="mt-1 text-sm text-oljim-muted">오늘 예약 / 취소 {branch.cancelled}</div>
                </div>
              ))}
              <div className="rounded-2xl border border-oljim-line p-4">
                <div className="text-sm text-oljim-muted">승인 대기</div>
                <div className="mt-2 text-3xl font-extrabold">{dashboard?.pendingApprovals ?? 0}</div>
                <div className="mt-1 text-sm text-oljim-muted">트레이너 확인 필요</div>
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">트레이너 관리</h2>
                <p className="text-sm text-oljim-muted">등록, 활성/비활성, 소속 지점 관리</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" placeholder="이름" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="input" placeholder="전화번호" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select className="input" value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
                <option value="">지점 선택</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              <input className="input" placeholder="전문 분야 / 소개" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <button className="btn-primary" type="button" onClick={createTrainer}>트레이너 등록</button>

            <div className="space-y-3">
              {trainers.map((trainer) => (
                <div key={trainer.id} className="rounded-2xl border border-oljim-line p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-bold">{trainer.name}</div>
                      <div className="mt-1 text-sm text-oljim-muted">{trainer.branch_name} · {trainer.phone}</div>
                      <div className="mt-1 text-sm text-oljim-muted">{trainer.bio || '소개 없음'}</div>
                    </div>
                    <button className={trainer.is_active ? 'btn-secondary' : 'btn-primary'} type="button" onClick={() => toggleTrainer(trainer)}>
                      {trainer.is_active ? '비활성화' : '활성화'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">슬롯 잠금 관리</h2>
            </div>
            <select className="input" value={selectedBranchId} onChange={async (e) => {
              setSelectedBranchId(e.target.value);
              const slots = await api.getBranchSlots(e.target.value, slotDate);
              setBranchSlots(slots);
            }}>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
            <input className="input" type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} />
            <div className="grid gap-2 sm:grid-cols-2">
              {branchSlots.map((slot) => {
                const blocked = slot.status === 'BLOCKED';
                const disabled = slot.status === 'FULL' || slot.status === 'CLOSED';
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleSlot(slot.id, !blocked)}
                    className={blocked ? 'slot-btn border-red-200 bg-red-50 text-red-700' : 'slot-btn border-oljim-line bg-white text-oljim-black'}
                  >
                    {slot.start.slice(0, 5)} · {blocked ? '잠금 해제' : '잠금'}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">월별 통계</h2>
              <input className="input max-w-40" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-oljim-muted">일별 확정 예약</div>
              <div className="space-y-2">
                {(stats?.monthly || []).length === 0 ? (
                  <div className="rounded-2xl bg-oljim-soft p-4 text-sm text-oljim-muted">통계 데이터가 없습니다.</div>
                ) : (
                  (stats?.monthly || []).map((row: any) => (
                    <div key={row.day}>
                      <div className="mb-1 flex items-center justify-between text-xs text-oljim-muted">
                        <span>{row.day}</span>
                        <span>{row.confirmed}</span>
                      </div>
                      <div className="h-2 rounded-full bg-oljim-soft">
                        <div className="h-2 rounded-full bg-oljim-black" style={{ width: `${(row.confirmed / maxConfirmed) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold text-oljim-muted">인기 시간대 TOP 5</div>
              <div className="space-y-2">
                {(stats?.popular || []).map((row: any) => (
                  <div key={row.start_time}>
                    <div className="mb-1 flex items-center justify-between text-xs text-oljim-muted">
                      <span>{row.start_time.slice(0, 5)}</span>
                      <span>{row.cnt}</span>
                    </div>
                    <div className="h-2 rounded-full bg-oljim-soft">
                      <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${(row.cnt / maxPopular) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {message ? <div className="card text-sm text-oljim-muted">{message}</div> : null}
        </aside>
      </div>
    </main>
  );
}
