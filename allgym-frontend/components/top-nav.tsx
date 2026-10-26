'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api, Role, SessionUser } from '@/lib/api';

type Props = {
  user: SessionUser | null;
  onRoleChanged?: (role: Role) => Promise<void> | void;
};

const items = [
  { href: '/customer', label: '고객', role: 'CUSTOMER' as Role },
  { href: '/trainer', label: '트레이너', role: 'TRAINER' as Role },
  { href: '/admin', label: '관리자', role: 'ADMIN' as Role },
];

export default function TopNav({ user, onRoleChanged }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await api.logout();
    router.push('/login');
    router.refresh();
  };

  const handleSwitch = async (role: Role) => {
    await api.switchRole(role);
    await onRoleChanged?.(role);
    router.push(items.find((x) => x.role === role)?.href || '/customer');
    router.refresh();
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-oljim-line bg-white p-4 shadow-card md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-xl font-extrabold tracking-tight">올짐 피트니스</div>
        <div className="text-sm text-oljim-muted">예약 관리 시스템 웹앱</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => handleSwitch(item.role)}
              className={active ? 'btn-primary px-4 py-2' : 'btn-secondary px-4 py-2'}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
        <Link
          href="/documents"
          className={pathname.startsWith('/documents') ? 'btn-primary px-4 py-2' : 'btn-secondary px-4 py-2'}
        >
          문서
        </Link>
        {user ? (
          <>
            <span className="rounded-full bg-oljim-soft px-3 py-2 text-sm font-medium text-oljim-muted">
              {user.name} · {user.role}
            </span>
            <button className="btn-secondary px-4 py-2" onClick={handleLogout} type="button">
              로그아웃
            </button>
          </>
        ) : (
          <Link className="btn-primary px-4 py-2" href="/login">
            로그인
          </Link>
        )}
      </div>
    </div>
  );
}
