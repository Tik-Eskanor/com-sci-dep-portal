import type {Metadata} from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'CS Dept Portal | The Polytechnic, Ibadan',
  description: 'Departmental Portal System for the Computer Science Department at The Polytechnic, Ibadan.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
