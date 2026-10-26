import type { MetadataRoute } from 'next';

// 설치형 웹앱(PWA) 정보: PC 바탕화면·휴대폰 홈 화면에 앱으로 설치
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: '올짐 피트니스',
    short_name: '올짐',
    description: '올짐 피트니스 예약 관리 · 문서 리더기',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0A0A0A',
    lang: 'ko',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: '문서함', url: '/documents', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
      { name: '파일 열기', url: '/open', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    ],
    // PC에 설치하면 PDF·Word 등을 "연결 프로그램 → 올짐"으로 열 수 있음 (크롬·엣지)
    file_handlers: [
      {
        action: '/open',
        accept: {
          'application/pdf': ['.pdf'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'text/plain': ['.txt'],
          'text/markdown': ['.md'],
          'image/png': ['.png'],
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/gif': ['.gif'],
          'image/webp': ['.webp'],
        },
      },
    ],
  } as MetadataRoute.Manifest;
}
