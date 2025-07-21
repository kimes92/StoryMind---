// app/layout.tsx
import './globals.css'; // ✅ Tailwind 작동의 핵심
import { ReactNode } from 'react';
import SessionProviderWrapper from './providers/SessionProviderWrapper';


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}