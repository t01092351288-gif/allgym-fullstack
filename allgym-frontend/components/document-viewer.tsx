'use client';

import { useEffect, useRef, useState } from 'react';

export type DocKind = 'pdf' | 'docx' | 'markdown' | 'text' | 'image' | 'unknown';

export function detectKind(mimeType: string, fileName: string): DocKind {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  const mime = mimeType.toLowerCase();
  if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
  if (mime.includes('wordprocessingml') || ext === 'docx') return 'docx';
  if (mime.includes('markdown') || ext === 'md') return 'markdown';
  if (mime.startsWith('text/') || ext === 'txt') return 'text';
  if (/^image\/(png|jpe?g|gif|webp)/.test(mime) || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
  return 'unknown';
}

export const ACCEPT = '.pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp';

type Props = { blob: Blob; mimeType: string; fileName: string };

export default function DocumentViewer({ blob, mimeType, fileName }: Props) {
  const kind = detectKind(mimeType, fileName);
  if (kind === 'pdf') return <PdfViewer blob={blob} />;
  if (kind === 'docx') return <DocxViewer blob={blob} />;
  if (kind === 'markdown') return <MarkdownViewer blob={blob} />;
  if (kind === 'text') return <TextViewer blob={blob} />;
  if (kind === 'image') return <ImageViewer blob={blob} alt={fileName} />;
  return <div className="rounded-2xl bg-oljim-soft p-6 text-sm text-oljim-muted">지원하지 않는 파일 형식입니다.</div>;
}

function Loading({ text = '문서를 불러오는 중…' }: { text?: string }) {
  return <div className="rounded-2xl bg-oljim-soft p-6 text-center text-sm text-oljim-muted">{text}</div>;
}

function ErrorBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{text}</div>;
}

// ── 확대/축소 버튼
function ZoomBar({ zoom, setZoom, children }: { zoom: number; setZoom: (z: number) => void; children?: React.ReactNode }) {
  const step = (d: number) => setZoom(Math.min(4, Math.max(0.5, Math.round((zoom + d) * 100) / 100)));
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-oljim-line bg-white/95 p-2 backdrop-blur">
      <div className="flex items-center gap-2">{children}</div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary min-h-10 px-3 py-2" onClick={() => step(-0.25)} aria-label="축소">−</button>
        <button type="button" className="min-w-14 text-center text-sm font-semibold" onClick={() => setZoom(1)} title="원래 크기">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className="btn-secondary min-h-10 px-3 py-2" onClick={() => step(0.25)} aria-label="확대">+</button>
      </div>
    </div>
  );
}

// ── PDF (pdf.js, 화면 폭에 맞춰 페이지별 렌더링)
function PdfViewer({ blob }: { blob: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let doc: any = null;
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
        const data = new Uint8Array(await blob.arrayBuffer());
        doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return doc.destroy();
        setPdf(doc);
        setPage(1);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('PDF를 열 수 없습니다. 파일이 손상되었거나 암호가 걸려 있을 수 있습니다.');
      }
    })();
    return () => {
      cancelled = true;
      doc?.destroy();
    };
  }, [blob]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => setPageInput(String(page)), [page]);

  useEffect(() => {
    if (!pdf || !width || !canvasRef.current) return;
    let task: any = null;
    let cancelled = false;
    (async () => {
      const p = await pdf.getPage(page);
      if (cancelled) return;
      const base = p.getViewport({ scale: 1 });
      const scale = (width / base.width) * zoom;
      const viewport = p.getViewport({ scale });
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const canvas = canvasRef.current!;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const ctx = canvas.getContext('2d')!;
      task = p.render({ canvasContext: ctx, viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined });
      await task.promise.catch(() => {});
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, page, zoom, width]);

  const total = pdf?.numPages || 0;
  const go = (n: number) => total && setPage(Math.min(total, Math.max(1, n)));

  if (error) return <ErrorBox text={error} />;

  return (
    <div className="space-y-3">
      <ZoomBar zoom={zoom} setZoom={setZoom}>
        <button type="button" className="btn-secondary min-h-10 px-3 py-2" disabled={page <= 1} onClick={() => go(page - 1)} aria-label="이전 페이지">‹</button>
        <form
          className="flex items-center gap-1 text-sm"
          onSubmit={(e) => {
            e.preventDefault();
            go(Number(pageInput) || page);
          }}
        >
          <input
            className="w-12 rounded-xl border border-oljim-line px-2 py-2 text-center"
            inputMode="numeric"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
            onBlur={() => go(Number(pageInput) || page)}
            aria-label="페이지 번호"
          />
          <span className="text-oljim-muted">/ {total || '-'}</span>
        </form>
        <button type="button" className="btn-secondary min-h-10 px-3 py-2" disabled={page >= total} onClick={() => go(page + 1)} aria-label="다음 페이지">›</button>
      </ZoomBar>
      <div ref={containerRef} className="overflow-auto rounded-2xl bg-oljim-soft">
        {!pdf ? <Loading /> : <canvas ref={canvasRef} className="mx-auto block bg-white shadow-card" />}
      </div>
    </div>
  );
}

// ── HTML 보기 공통 (DOMPurify로 정리)
function useSanitizedHtml(load: () => Promise<string>, deps: unknown[]) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setError('');
    (async () => {
      try {
        const [raw, { default: DOMPurify }] = await Promise.all([load(), import('dompurify')]);
        if (!cancelled) setHtml(DOMPurify.sanitize(raw));
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('문서를 열 수 없습니다. 파일이 손상되었을 수 있습니다.');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { html, error };
}

function HtmlDoc({ html, error }: { html: string | null; error: string }) {
  const [zoom, setZoom] = useState(1);
  if (error) return <ErrorBox text={error} />;
  if (html === null) return <Loading />;
  return (
    <div className="space-y-3">
      <ZoomBar zoom={zoom} setZoom={setZoom} />
      <article className="doc-content rounded-2xl border border-oljim-line bg-white p-5 md:p-8" style={{ fontSize: `${zoom}rem` }} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

// ── Word (.docx → HTML, mammoth)
function DocxViewer({ blob }: { blob: Blob }) {
  const state = useSanitizedHtml(async () => {
    const mammoth = await import('mammoth');
    const result = await mammoth.convertToHtml(
      { arrayBuffer: await blob.arrayBuffer() },
      { styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh"] }
    );
    return result.value || '<p>(내용이 없습니다)</p>';
  }, [blob]);
  return <HtmlDoc {...state} />;
}

// ── 마크다운
function MarkdownViewer({ blob }: { blob: Blob }) {
  const state = useSanitizedHtml(async () => {
    const { marked } = await import('marked');
    return marked.parse(await blob.text(), { async: false }) as string;
  }, [blob]);
  return <HtmlDoc {...state} />;
}

// ── 텍스트
function TextViewer({ blob }: { blob: Blob }) {
  const [text, setText] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    blob.text().then(setText);
  }, [blob]);
  if (text === null) return <Loading />;
  return (
    <div className="space-y-3">
      <ZoomBar zoom={zoom} setZoom={setZoom} />
      <pre className="whitespace-pre-wrap break-words rounded-2xl border border-oljim-line bg-white p-5 font-sans leading-7" style={{ fontSize: `${zoom}rem` }}>
        {text}
      </pre>
    </div>
  );
}

// ── 이미지
function ImageViewer({ blob, alt }: { blob: Blob; alt: string }) {
  const [url, setUrl] = useState('');
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return <Loading />;
  return (
    <div className="space-y-3">
      <ZoomBar zoom={zoom} setZoom={setZoom} />
      <div className="overflow-auto rounded-2xl bg-oljim-soft p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="mx-auto block max-w-none" style={{ width: `${zoom * 100}%` }} />
      </div>
    </div>
  );
}
