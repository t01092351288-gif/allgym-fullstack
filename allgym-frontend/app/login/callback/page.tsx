'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, rolePath } from '@/lib/api';

export default function LoginCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('세션 확인 중입니다...');

  useEffect(() => {
    api.getMe()
      .then((res) => {
        if (res.user) {
          setMessage(`${res.user.name} 님으로 로그인되었습니다. 이동 중...`);
          router.replace(rolePath(res.user.role));
          return;
        }
        setMessage('세션이 확인되지 않았습니다. 로그인 화면으로 이동합니다.');
        router.replace('/login');
      })
      .catch(() => {
        setMessage('로그인 처리 중 문제가 발생했습니다. 다시 시도해주세요.');
      });
  }, [router]);

  return (
    <main className="page-shell flex items-center justify-center">
      <div className="card max-w-xl text-center">
        <h1 className="text-2xl font-bold">카카오 로그인 처리</h1>
        <p className="mt-3 text-sm text-oljim-muted">{message}</p>
      </div>
    </main>
  );
}
