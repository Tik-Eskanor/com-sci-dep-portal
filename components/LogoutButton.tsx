'use client';

import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { handleLogoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    toast.loading('Logging out of CS Portal...', { id: 'logout-toast' });

    try {
      await handleLogoutAction();
      toast.success('Signed out', { id: 'logout-toast', duration: 3000 });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      toast.success('Signed out', { id: 'logout-toast', duration: 3000 });
      router.push('/login');
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleLogout} 
      disabled={isLoggingOut}
      className="flex w-full items-center text-red-400 hover:text-red-300 font-bold text-xs py-2 px-1 transition-colors cursor-pointer disabled:opacity-50"
      title="Sign out of your portal account"
    >
      {isLoggingOut ? (
        <Loader2 className="w-4 h-4 mr-2 shrink-0 animate-spin text-red-400" />
      ) : (
        <LogOut className="w-4 h-4 mr-2 shrink-0" />
      )}
      <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
    </button>
  );
}
