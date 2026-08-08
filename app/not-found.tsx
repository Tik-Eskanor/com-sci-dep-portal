import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[var(--color-poly-bg)]">
      <h2 className="text-4xl font-bold text-[var(--color-poly-primary)] mb-4">404 - Page Not Found</h2>
      <p className="text-slate-600 mb-8 max-w-md">The page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="bg-[var(--color-poly-primary)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-poly-primary-light)] transition-colors">
        Return Home
      </Link>
    </div>
  );
}
