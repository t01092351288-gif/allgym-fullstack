'use client';

import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// 서비스 워커 등록 (layout에서 한 번)
export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}

// "앱 설치" 버튼: 크롬·엣지·안드로이드는 바로 설치, 아이폰은 안내 문구
export function InstallButton({ className = 'btn-secondary px-4 py-2' }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setInstalled(standalone);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || (!prompt && !isIos)) return null;

  if (!prompt && isIos) {
    return (
      <span className="relative">
        <button type="button" className={className} onClick={() => setShowIosHelp((v) => !v)}>
          앱 설치
        </button>
        {showIosHelp ? (
          <span className="absolute right-0 top-full z-20 mt-2 w-60 rounded-2xl border border-oljim-line bg-white p-3 text-sm text-oljim-muted shadow-card">
            Safari 하단의 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>를 누르세요.
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        await prompt!.prompt();
        await prompt!.userChoice;
        setPrompt(null);
      }}
    >
      앱 설치
    </button>
  );
}
