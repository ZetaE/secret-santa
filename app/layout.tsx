import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secret Santa',
  description: 'Organizza il tuo Secret Santa',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
          {children}
        </div>
      </body>
    </html>
  );
}
