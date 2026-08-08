'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn, Menu, X } from 'lucide-react';

export default function MainHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[var(--color-poly-primary)] text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 relative bg-white p-1 rounded-xl shadow-xs overflow-hidden shrink-0 border border-amber-200/50 group-hover:scale-105 transition-transform">
              <Image 
                src="/logo.jpeg" 
                alt="The Polytechnic, Ibadan Logo" 
                fill 
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-wide block leading-tight group-hover:text-[var(--color-poly-secondary)] transition-colors">
                COMPUTER SCIENCE
              </span>
              <span className="text-[11px] text-slate-300 font-medium">The Polytechnic, Ibadan</span>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link href="/#about" className="text-sm font-medium hover:text-[var(--color-poly-secondary)] transition-colors">About</Link>
            <Link href="/#programs" className="text-sm font-medium hover:text-[var(--color-poly-secondary)] transition-colors">Programs</Link>
            <Link href="/#staff" className="text-sm font-medium hover:text-[var(--color-poly-secondary)] transition-colors">Staff</Link>
            <Link href="/#contact" className="text-sm font-medium hover:text-[var(--color-poly-secondary)] transition-colors">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:flex items-center gap-2 bg-[var(--color-poly-secondary)] text-[var(--color-poly-primary)] px-4 py-2 rounded-md font-semibold text-sm hover:bg-[var(--color-poly-secondary-dark)] transition-colors">
              <LogIn className="w-4 h-4" />
              Portal Login
            </Link>
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--color-poly-primary-light)] px-4 py-4 space-y-4">
          <Link href="/#about" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:text-[var(--color-poly-secondary)] transition-colors">About</Link>
          <Link href="/#programs" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:text-[var(--color-poly-secondary)] transition-colors">Programs</Link>
          <Link href="/#staff" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:text-[var(--color-poly-secondary)] transition-colors">Staff</Link>
          <Link href="/#contact" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium hover:text-[var(--color-poly-secondary)] transition-colors">Contact</Link>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 bg-[var(--color-poly-secondary)] text-[var(--color-poly-primary)] px-4 py-2 rounded-md font-semibold text-sm hover:bg-[var(--color-poly-secondary-dark)] transition-colors w-fit">
            <LogIn className="w-4 h-4" />
            Portal Login
          </Link>
        </div>
      )}
    </header>
  );
}
