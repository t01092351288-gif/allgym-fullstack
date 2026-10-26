'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopNav from '@/components/top-nav';
import { api, rolePath, SessionUser } from '@/lib/api';

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [phone, setPhone] = useState('010-2222-1111');
  const [code, setCode] = useState('000000');
  const [name, setName] = useState('홍길동');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const fallback = useMemo(() => params.get('fallback') === '1', [params]);

  useEffect(() => {
    api.getMe().then((res) => {
      setUser(res.user);
      if (res.user) router.replace(rolePath(res.user.role));
    });
  }, [router]);

  useEffect(() => {
    if (fallback) setMessage('카카오 폴백 로그인으로 세션이 생성되었습니다.');
  }, [fallback]);

  const onSend = async () => {
    try {
      setSending(true);
      const res = await api.sendPhoneCode(phone);
      setMessage(res.code ? `인증코드 발송 완료 (개발 코드: ${res.code})` : '인증코드를 발송했습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '인증코드 발송 실패');
    } finally {
      setSending(false);
    }
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setVerifying(true);
      const res = await api.verifyPhone(phone, code, name);
      router.replace(rolePath(res.user.role));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '로그인 실패');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main className="page-shell max-w-3xl">
      <TopNav user={user} />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card space-y-4">
          <div className="inline-flex rounded-full bg-oljim-soft px-3 py-1 text-sm font-medium text-oljim-muted">
            로그인 / 인증
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">올짐 로그인</h1>
          <p className="text-sm text-oljim-muted">
            카카오 로그인 또는 전화번호 인증으로 로그인할 수 있습니다. 현재 프론트는 백엔드 세션쿠키 기반으로 동작합니다.
          </p>
          <a className="btn-primary w-full" href={`${api.baseUrl}/v1/auth/kakao`}>
            카카오로 로그인
          </a>
          <div className="rounded-2xl border border-dashed border-oljim-line p-4 text-sm text-oljim-muted">
            카카오 키가 없더라도 백엔드에서 폴백 모드를 켜두면 테스트용 계정으로 즉시 로그인됩니다.
          </div>
        </section>

        <section className="card">
          <form className="space-y-3" onSubmit={onVerify}>
            <h2 className="text-xl font-bold">전화번호 인증</h2>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" />
            <div className="grid gap-3 md:grid-cols-[1fr_120px]">
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="인증코드 6자리" />
              <button className="btn-secondary" type="button" onClick={onSend} disabled={sending}>
                {sending ? '발송 중' : '코드 발송'}
              </button>
            </div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름 (선택)" />
            <button className="btn-primary w-full" type="submit" disabled={verifying}>
              {verifying ? '로그인 중...' : '전화번호로 로그인'}
            </button>
            {message ? <div className="rounded-2xl bg-oljim-soft p-3 text-sm text-oljim-muted">{message}</div> : null}
          </form>
        </section>
      </div>
    </main>
  );
}
