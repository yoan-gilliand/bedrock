import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'concurp2-lab21 · GitLab',
  description: 'Python RabbitMQ RPC-based word-by-word translator using Unix pipes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
