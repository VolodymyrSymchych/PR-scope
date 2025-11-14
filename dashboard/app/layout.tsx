import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ConditionalLayout } from '@/components/ConditionalLayout';
import { Toaster } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Project Scope Analyzer - Dashboard',
  description: 'AI-powered project scope analysis and risk detection dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} glass-theme bg-background text-text-primary`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: 'toast-notification',
              style: {
                maxWidth: '420px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                className: 'toast-notification toast-notification-success',
                iconTheme: {
                  primary: 'rgb(34, 197, 94)',
                  secondary: 'rgba(255, 255, 255, 0.9)',
                },
              },
              error: {
                className: 'toast-notification toast-notification-error',
                iconTheme: {
                  primary: 'rgb(239, 68, 68)',
                  secondary: 'rgba(255, 255, 255, 0.9)',
                },
              },
              loading: {
                className: 'toast-notification toast-notification-loading',
                iconTheme: {
                  primary: 'rgb(128, 152, 249)',
                  secondary: 'rgba(255, 255, 255, 0.9)',
                },
              },
            }}
          />
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
