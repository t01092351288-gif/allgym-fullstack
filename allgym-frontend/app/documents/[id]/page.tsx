'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import TopNav from '@/components/top-nav';
import DocumentViewer from '@/components/document-viewer';
import { api, DocumentMeta, SessionUser } from '@/lib/api';

export default function DocumentViewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [meta, setMeta] = useState<DocumentMeta | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMe().then(async (res) => {
      if (!res.user) return router.replace('/login');
      setUser(res.user);
      try {
        const [m, b] = await Promise.all([api.getDocument(id), api.getDocumentFile(id)]);
        setMeta(m);
        setBlob(b);
      } catch (e) {
        setError(e instanceof Error ? e.message : '문서를 불러오지 못했습니다');
      }
    });
  }, [id, router]);

  const download = () => {
    if (!blob || !meta) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.file_name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <main className="page-shell">
      <TopNav user={user} />
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/documents" className="text-sm text-oljim-muted hover:text-oljim-black">‹ 문서함</Link>
            <h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight">{meta?.title || '문서'}</h1>
            {meta ? <div className="mt-1 truncate text-xs text-oljim-muted">{meta.file_name}</div> : null}
          </div>
          {blob ? (
            <button type="button" className="btn-secondary shrink-0 px-3 py-2" onClick={download}>다운로드</button>
          ) : null}
        </div>
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>
        ) : blob && meta ? (
          <DocumentViewer blob={blob} mimeType={meta.mime_type} fileName={meta.file_name} />
        ) : (
          <div className="rounded-2xl bg-oljim-soft p-6 text-center text-sm text-oljim-muted">문서를 불러오는 중…</div>
        )}
      </div>
    </main>
  );
}
