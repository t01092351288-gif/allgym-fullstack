import './globals.css';
import type { Metadata, Viewport } from 'next';
import { RegisterServiceWorker } from '@/components/pwa';

export const metadata: Metadata = {
  title: '올짐 피트니스 예약 시스템',
  description: '올짐 피트니스 예약 관리 시스템 프론트엔드',
  applicationName: '올짐',
  appleWebApp: { capable: true, title: '올짐', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
