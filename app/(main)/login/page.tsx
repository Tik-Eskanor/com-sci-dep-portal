'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2, LogIn, Lock, UserCheck } from 'lucide-react';
import { login } from './actions';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    toast.loading('Authenticating credentials...', { id: 'login-toast' });

    const formData = new FormData(e.currentTarget);
    try {
      const res = await login(null, formData);

      if (res?.error) {
        setError(res.error);
        toast.error(res.error, { id: 'login-toast' });
        setIsSubmitting(false);
      } else if (res?.success && res.redirectPath) {
        toast.success('Signed in', { 
          id: 'login-toast',
          duration: 3000 
        });
        router.push(res.redirectPath);
        router.refresh();
      } else {
        setError('Login failed. Please verify your credentials and try again.');
        toast.error('Login failed. Please verify your credentials and try again.', { id: 'login-toast' });
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Submit error:', err);
      const errorMessage = 'An unexpected network error occurred.';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'login-toast' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-poly-bg)] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200/90">
        <div className="text-center">
          <div className="w-20 h-20 relative bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/90 mx-auto mb-4 overflow-hidden">
            <Image 
              src="/logo.jpeg" 
              alt="The Polytechnic, Ibadan Logo" 
              fill 
              className="object-contain p-1"
              priority
            />
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 uppercase tracking-wider">
            CS Portal Sign In
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            The Polytechnic, Ibadan &bull; Department of Computer Science
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3.5 rounded-xl text-xs font-bold border border-red-200/80 flex items-start gap-2.5 animate-in fade-in">
            <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="matric" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Staff ID / Matric Number / Email
              </label>
              <input
                id="matric"
                name="matric"
                type="text"
                required
                disabled={isSubmitting}
                className="appearance-none relative block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm shadow-2xs font-medium placeholder:text-slate-400 disabled:opacity-60"
                placeholder="e.g. CS/STAFF/001 or staff@polyibadan.edu.ng"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isSubmitting}
                className="appearance-none relative block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-slate-900 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm shadow-2xs font-medium placeholder:text-slate-400 disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[var(--color-poly-primary)] focus:ring-[var(--color-poly-primary)] border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600 font-medium cursor-pointer">
                Remember me
              </label>
            </div>

            <div className="text-xs">
              <a href="#" className="font-bold text-[var(--color-poly-primary)] hover:underline">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-poly-primary)] transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-poly-secondary)]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-[var(--color-poly-secondary)]" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2">
            <Link href="/" className="hover:text-[var(--color-poly-primary)] font-bold uppercase tracking-wider transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
