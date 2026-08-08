'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, LogIn } from 'lucide-react';
import { login } from './actions';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(login, { error: '' });

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success && state?.redirectPath) {
      toast.success('Signed in successfully!');
      router.push(state.redirectPath);
    }
  }, [state, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-poly-bg)] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-sm w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="bg-[var(--color-poly-primary)] w-12 h-12 rounded flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-[var(--color-poly-secondary)]" />
          </div>
          <h2 className="mt-2 text-2xl font-bold text-[var(--color-poly-text-heading)] uppercase tracking-wider">
            CS Portal
          </h2>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            Sign in to access your dashboard
          </p>
        </div>

        {state?.error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-xs font-bold border border-red-100 mt-4">
            {state.error}
          </div>
        )}

        <form className="mt-8 space-y-6" action={formAction}>

          <div className="space-y-4">
            <div>
              <label htmlFor="matric" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Staff ID / Matric Number / Email
              </label>
              <input
                id="matric"
                name="matric"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-200 placeholder-slate-400 text-[#0F172A] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-poly-primary)] focus:border-[var(--color-poly-primary)] sm:text-sm shadow-sm"
                placeholder="e.g. CS/STAFF/001 or staff@polyibadan.edu.ng"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-slate-200 placeholder-slate-400 text-[#0F172A] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-poly-primary)] focus:border-[var(--color-poly-primary)] sm:text-sm shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[var(--color-poly-primary)] focus:ring-[var(--color-poly-primary)] border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-600">
                Remember me
              </label>
            </div>

            <div className="text-xs">
              <a href="#" className="font-bold text-[var(--color-poly-primary)] hover:text-[var(--color-poly-primary-light)]">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-bold rounded text-white bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-poly-primary)] transition-colors shadow-sm disabled:opacity-70"
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          
          <div className="text-center text-xs text-slate-500 mt-4">
            <Link href="/" className="hover:text-[var(--color-poly-primary)] font-bold uppercase tracking-wider">&larr; Back to Home</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
