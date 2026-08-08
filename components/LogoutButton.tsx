'use client';

import { LogOut } from "lucide-react";
import { handleLogoutAction } from '@/app/actions/auth';

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await handleLogoutAction();
    } catch {
      // Ignore any redirect or network errors on logout
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleLogout} 
      className="flex w-full items-center text-red-400 hover:text-red-300 font-bold text-xs py-2 px-1 transition-colors cursor-pointer"
    >
      <LogOut className="w-4 h-4 mr-2 shrink-0" />
      <span>Logout</span>
    </button>
  );
}
