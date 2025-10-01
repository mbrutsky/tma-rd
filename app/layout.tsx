// app/layout.tsx

import { Inter } from 'next/font/google';
// @ts-ignore
import './globals.css';
import Script from 'next/script';
import { Providers } from '@/src/lib/store/provider';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata = {
  title: 'Delegator-Controller - Telegram Mini App',
  description: 'Управление задачами для вашей команды',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Telegram Web App Script */}
        <Script 
          src="https://telegram.org/js/telegram-web-app.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}