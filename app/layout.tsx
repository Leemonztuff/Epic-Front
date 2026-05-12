import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { NavigationProvider } from '@/lib/contexts/NavigationContext';

export const metadata: Metadata = {
  title: 'Epic Frontier',
  description: 'RPG',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>
          <ToastProvider>
            <NavigationProvider>
              {children}
            </NavigationProvider>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
