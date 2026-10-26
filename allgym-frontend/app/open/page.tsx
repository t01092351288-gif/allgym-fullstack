'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DocumentViewer, { ACCEPT } from '@/components/document-viewer';
import { InstallButton } from '@/components/pwa';

// 로그인 없이 내 기기 파일을 여는 리더기.
// PC에 앱을 설치하면 PDF 등을 "연결 프로그램 → 올짐"으로 열 때 이 화면으로 들어옴.
export default function OpenFilePage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const lq = (window as any).launchQueue;
    if (!lq?.setConsumer) return;
    lq.setConsumer(async (params: { files?: FileSystemFileHandle[] }) => {
      const handle = params.files?.[0];
      if (handle) setFile(await handle.getFile());
    });
  }, []);

  useEffect(() => {
    document.title = file ? `${file.name} - 올짐` : '파일 열기 - 올짐';
  }, [file]);

  return (
    <main
      className="page-shell"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) setFile(f);
      }}
    >
      <div className="card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="text-sm text-oljim-muted hover:text-oljim-black">‹ 올짐 홈</Link>
            <h1 className="mt-1 break-words text-2xl font-extrabold tracking-tight">{file?.name || '파일 열기'}</h1>
            <p className="mt-1 text-sm text-oljim-muted">PDF · Word · 텍스트 · 마크다운 · 이미지 · 파일은 이 기기 밖으로 나가지 않아요.</p>
          </div>
          <InstallButton />
        </div>
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-6 text-center text-sm transition ${
            dragging ? 'border-oljim-black bg-oljim-soft' : 'border-oljim-line text-oljim-muted'
          }`}
        >
          <span className="font-semibold text-oljim-black">{file ? '다른 파일 열기' : '파일 선택'}</span>
          <span>또는 여기로 끌어다 놓기</span>
          <input className="sr-only" type="file" accept={ACCEPT} onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
        </label>
        {file ? <DocumentViewer key={`${file.name}-${file.size}-${file.lastModified}`} blob={file} mimeType={file.type} fileName={file.name} /> : null}
      </div>
    </main>
  );
}
