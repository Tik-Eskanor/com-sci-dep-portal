import Link from 'next/link';
import MainHeader from '@/components/MainHeader';

export default function MainLayout({children}: {children: React.ReactNode}) {
  return (
    <>
      <MainHeader />
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      <footer className="bg-[var(--color-poly-primary-light)] text-gray-300 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Computer Science Dept.</h3>
            <p className="text-sm text-gray-400">The Polytechnic, Ibadan<br/>Oyo State, Nigeria.</p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="hover:text-[var(--color-poly-secondary)] transition-colors">Student Login</Link></li>
              <li><Link href="/login" className="hover:text-[var(--color-poly-secondary)] transition-colors">Staff Login</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
            <p className="text-sm text-gray-400">Email: hod.cs@polyibadan.edu.ng<br/>Phone: +234 800 000 0000</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-gray-700 text-sm text-center text-gray-500">
          &copy; {new Date().getFullYear()} Computer Science Department, The Polytechnic, Ibadan. All rights reserved.
        </div>
      </footer>
    </>
  );
}
