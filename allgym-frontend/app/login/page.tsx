import { Suspense } from 'react';
import LoginClient from './login-client';

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="page-shell"><div className="card">로그인 화면을 불러오는 중...</div></main>}>
      <LoginClient />
    </Suspense>
  );
}
