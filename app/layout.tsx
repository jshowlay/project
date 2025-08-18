import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// import { bootOnce } from '@/server/boot';
import { DensityProvider } from '@/components/DensityProvider';
// bootOnce();

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Trender AI - Daily Trend Brief Generator',
  description: 'AI-powered trend analysis and content brief generation for creators',
  keywords: 'trends, AI, content creation, social media, analytics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <DensityProvider>
          {children}
        </DensityProvider>
      </body>
    </html>
  );
}