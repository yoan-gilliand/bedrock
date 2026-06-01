import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Programmation Concurrente · GitLab',
  description: 'RabbitMQ Producer/Consumer Patterns - Exam Cheat Sheet',
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
