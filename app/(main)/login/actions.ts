'use server';

import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

export async function login(prevState: any, formData: FormData) {
  const identifier = (formData.get('matric') as string)?.trim();
  const password = formData.get('password') as string;

  if (!identifier || !password) {
    return { error: 'Staff ID, Matric Number, or Email and password are required.' };
  }

  let redirectPath: string | null = null;

  try {
    // 1. Search for user by Email, Staff ID, or Student Matric Number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { staffProfile: { staffId: { equals: identifier, mode: 'insensitive' } } },
          { studentProfile: { matricNumber: { equals: identifier, mode: 'insensitive' } } }
        ]
      },
      include: {
        staffProfile: true,
        studentProfile: true
      }
    });

    if (!user) {
      return { error: 'Account not found. Please check your Staff ID, Email, or Matric Number.' };
    }

    // 2. Check password (supports hashed and plain-text legacy passwords)
    let isMatch = false;

    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Plain text check & auto-upgrade
      if (user.password === password) {
        isMatch = true;
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });
      }
    }

    if (!isMatch) {
      return { error: 'Invalid credentials.' };
    }

    // 3. Create session & route user based on role
    await createSession(user.id, user.role);

    if (user.role === 'Admin') {
      redirectPath = '/hod/dashboard';
    } else if (user.role === 'Staff') {
      redirectPath = '/staff/dashboard';
    } else {
      redirectPath = '/student/dashboard';
    }
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Is the database connected?' };
  }

  if (redirectPath) {
    return { success: true, redirectPath };
  }
}
