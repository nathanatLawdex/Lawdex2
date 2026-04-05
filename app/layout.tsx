import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pardella',
  description: 'Collaborative legal knowledge and document discussion platform.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
