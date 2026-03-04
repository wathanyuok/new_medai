// app/layout.tsx
import { ReactNode } from 'react'
import ClientLayout from './layout.client'

export const metadata = {
  title: 'EXA MED+',
  description: '',
  // themeColor: '#F2F8FD',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/favicon.ico',
    apple: '/images/favicon.ico'
  },
  // viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/images/logo/logo.svg" />
        <meta name="theme-color" content="#F2F8FD" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
