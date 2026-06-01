import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Document Analysis Platform',
  description: 'Secure document analysis and chat interface powered by AWS Bedrock',
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
