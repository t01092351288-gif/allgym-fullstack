import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '올짐 피트니스 예약 시스템',
  description: '올짐 피트니스 예약 관리 시스템 프론트엔드',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
