'use server';

import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function login(prevState: any, formData: FormData) {
  const identifier = (formData.get('matric') as string)?.trim();
  const password = formData.get('password') as string;

  if (!identifier || !password) {
    return { error: 'Staff ID, Matric Number, or Email and password are required.' };
  }

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
      return { error: 'Invalid credentials. Please check your password.' };
    }

    // 3. Create session
    await createSession(user.id, user.role);

    let redirectPath = '/student/dashboard';
    if (user.role === 'Admin') {
      redirectPath = '/hod/dashboard';
    } else if (user.role === 'Staff') {
      redirectPath = '/staff/dashboard';
    }

    const title = user.staffProfile?.title ? `${user.staffProfile.title} ` : '';
    const userName = `${title}${user.firstName} ${user.lastName}`.trim();

    return { 
      success: true, 
      redirectPath,
      userName,
      role: user.role
    };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please check database connection.' };
  }
}
