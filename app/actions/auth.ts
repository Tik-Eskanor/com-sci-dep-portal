'use server';

import { logout } from '@/lib/session';

export async function handleLogoutAction() {
  await logout();
  return { success: true };
}
