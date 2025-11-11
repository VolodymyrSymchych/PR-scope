'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/components/SidebarContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MainContent } from '@/components/MainContent';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Pages that should not have sidebar and header
  const authPages = ['/sign-in', '/sign-up', '/verify', '/forgot-password'];
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage) {
    // Render without sidebar and header for auth pages
    return <>{children}</>;
  }

  // Render with sidebar and header for all other pages
  return (
    <SidebarProvider>
      <div className="flex h-screen relative overflow-hidden">
        <Sidebar />
        <MainContent>
          <Header />
          <div className="p-8 h-full flex flex-col overflow-hidden min-h-0">
            {children}
          </div>
        </MainContent>
      </div>
    </SidebarProvider>
  );
}
