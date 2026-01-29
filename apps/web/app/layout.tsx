import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'WA Transparency - Washington State Political Transparency',
    template: '%s | WA Transparency',
  },
  description:
    'Track money in Washington State politics. Explore campaign contributions, lobbying activities, and government contracts.',
  keywords: [
    'Washington State',
    'politics',
    'transparency',
    'campaign finance',
    'lobbying',
    'government contracts',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
