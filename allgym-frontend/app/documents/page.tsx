'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/top-nav';
import DocumentViewer, { ACCEPT, detectKind } from '@/components/document-viewer';
import { api, DocAudience, DocumentMeta, SessionUser } from '@/lib/api';

const KIND_LABEL: Record<string, string> = {
  pdf: 'PDF',
  docx: 'Word',
  markdown: '마크다운',
  text: '텍스트',
  image: '이미지',
  unknown: '파일',
};

const AUDIENCE_LABEL: Record<DocAudience, string> = {
  ALL: '전체 공개',
  TRAINER: '트레이너 이상',
  ADMIN: '관리자만',
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState<DocAudience>('ALL');
  const [uploading, setUploading] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);
  const [localFile, setLocalFile] = useState<File | null>(null);

  const load = async () => {
    try {
      setDocs(await api.getDocuments());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '문서 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getMe().then((res) => {
      if (!res.user) return router.replace('/login');
      setUser(res.user);
      load();
    });
  }, [router]);

  const upload = async () => {
    if (!file) return setMessage('업로드할 파일을 선택해 주세요.');
    setUploading(true);
    try {
      await api.uploadDocument(file, title, audience);
      setMessage('문서를 올렸습니다.');
      setFile(null);
      setTitle('');
      setUploadKey((k) => k + 1);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const remove = async (doc: DocumentMeta) => {
    if (!confirm(`"${doc.title}" 문서를 삭제할까요?`)) return;
    try {
      await api.deleteDocument(doc.id);
      setMessage('문서를 삭제했습니다.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '삭제 실패');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <main className="page-shell">
      <TopNav user={user} />

      <div className="space-y-4">
        <div className="card">
          <div className="text-sm text-oljim-muted">PDF · Word · 텍스트 · 이미지</div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">문서함</h1>
          <p className="mt-2 text-sm text-oljim-muted">센터에서 공유한 문서를 앱에서 바로 읽을 수 있어요.</p>
        </div>

        {isAdmin ? (
          <div className="card space-y-3">
            <h2 className="text-xl font-bold">문서 올리기</h2>
            <input key={uploadKey} className="input" type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" placeholder="제목 (비우면 파일명 사용)" value={title} onChange={(e) => setTitle(e.target.value)} />
              <select className="input" value={audience} onChange={(e) => setAudience(e.target.value as DocAudience)}>
                <option value="ALL">전체 공개 (회원 포함)</option>
                <option value="TRAINER">트레이너 이상</option>
                <option value="ADMIN">관리자만</option>
              </select>
            </div>
            <button className="btn-primary" type="button" disabled={uploading || !file} onClick={upload}>
              {uploading ? '올리는 중…' : '업로드'}
            </button>
            <p className="text-xs text-oljim-muted">PDF, DOCX, TXT, MD, PNG, JPG, GIF, WEBP · 최대 20MB</p>
          </div>
        ) : null}

        <div className="card space-y-3">
          <h2 className="text-xl font-bold">문서 목록</h2>
          {loading ? (
            <div className="rounded-2xl bg-oljim-soft p-4 text-sm text-oljim-muted">불러오는 중…</div>
          ) : docs.length === 0 ? (
            <div className="rounded-2xl bg-oljim-soft p-4 text-sm text-oljim-muted">등록된 문서가 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 rounded-2xl border border-oljim-line p-3">
                  <Link href={`/documents/${doc.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="shrink-0 rounded-xl bg-oljim-soft px-2 py-1 text-xs font-bold text-oljim-muted">
                      {KIND_LABEL[detectKind(doc.mime_type, doc.file_name)]}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{doc.title}</span>
                      <span className="block truncate text-xs text-oljim-muted">
                        {formatBytes(doc.size_bytes)} · {doc.created_at.slice(0, 10)}
                        {isAdmin ? ` · ${AUDIENCE_LABEL[doc.audience]}` : ''}
                      </span>
                    </span>
                  </Link>
                  {isAdmin ? (
                    <button type="button" className="btn-secondary min-h-10 px-3 py-2 text-red-600" onClick={() => remove(doc)}>
                      삭제
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <div>
            <h2 className="text-xl font-bold">내 기기 파일 열기</h2>
            <p className="text-sm text-oljim-muted">업로드 없이 이 기기에서만 열어봅니다.</p>
          </div>
          <input className="input" type="file" accept={ACCEPT} onChange={(e) => setLocalFile(e.target.files?.[0] || null)} />
          {localFile ? <DocumentViewer key={`${localFile.name}-${localFile.size}`} blob={localFile} mimeType={localFile.type} fileName={localFile.name} /> : null}
        </div>

        {message ? <div className="card text-sm text-oljim-muted">{message}</div> : null}
      </div>
    </main>
  );
}
