import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/contexts/ToastContext';
import IdleManagerProvider from '@/components/IdleManagerProvider';
import PhoneAuthListener from '@/components/PhoneAuthListener';

export const metadata: Metadata = {
  title: 'Golf Range',
  description: 'Golf Range interface prototype',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <IdleManagerProvider>
            <PhoneAuthListener />
            {children}
          </IdleManagerProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
