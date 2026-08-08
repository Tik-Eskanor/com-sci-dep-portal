'use server';

import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getStudentProfileData() {
  const session = await getSession();
  if (!session || session.role !== 'Student') {
    return { error: 'Unauthorized: Student access required.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        studentProfile: true
      }
    });

    if (!user) {
      return { error: 'User account not found.' };
    }

    return {
      email: user.email,
      phone: user.phone || '',
      firstName: user.firstName,
      lastName: user.lastName,
      matricNumber: user.studentProfile?.matricNumber || '',
      level: user.studentProfile?.level || '',
      academicSession: user.studentProfile?.academicSession || '',
      passportPhotoUrl: user.studentProfile?.passportPhotoUrl || null,
      updatedAt: user.updatedAt.toISOString(),
      accountVerified: true,
      securityStatus: {
        sessionType: 'Encrypted JWT Cookie (HTTPOnly)',
        role: user.role,
        department: 'Computer Science'
      }
    };
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return { error: 'Failed to fetch student profile data.' };
  }
}

export async function updateStudentProfileData(data: { phone?: string; passportPhotoUrl?: string | null }) {
  const session = await getSession();
  if (!session || session.role !== 'Student') {
    return { error: 'Unauthorized: Session expired or invalid.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { studentProfile: true }
    });

    if (!user) {
      return { error: 'User account not found.' };
    }

    // Input Validation: Phone number formatting & length check
    if (data.phone !== undefined) {
      const trimmedPhone = data.phone.trim();
      if (trimmedPhone.length > 20) {
        return { error: 'Phone number cannot exceed 20 characters.' };
      }
      // Allowed phone characters: digits, spaces, hyphens, plus, brackets
      if (trimmedPhone.length > 0 && !/^[0-9+\-\s()]+$/.test(trimmedPhone)) {
        return { error: 'Invalid phone number format. Only numbers, spaces, and standard phone symbols are allowed.' };
      }

      await prisma.user.update({
        where: { id: session.userId },
        data: { phone: trimmedPhone }
      });
    }

    // Input Validation: Passport Photo URL
    if (data.passportPhotoUrl !== undefined) {
      if (data.passportPhotoUrl !== null) {
        // Ensure it's a valid image data URI or HTTP link
        const isDataUrl = data.passportPhotoUrl.startsWith('data:image/');
        const isHttpUrl = data.passportPhotoUrl.startsWith('http://') || data.passportPhotoUrl.startsWith('https://');

        if (!isDataUrl && !isHttpUrl) {
          return { error: 'Invalid photo format. Photo must be a valid image file.' };
        }

        // Limit data URL size (e.g., max ~3.5MB string length)
        if (isDataUrl && data.passportPhotoUrl.length > 3.5 * 1024 * 1024) {
          return { error: 'Image file payload exceeds maximum allowed limit (2.5MB).' };
        }
      }

      if (user.studentProfile) {
        await prisma.studentProfile.update({
          where: { id: user.studentProfile.id },
          data: { passportPhotoUrl: data.passportPhotoUrl }
        });
      }
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating student profile:', error);
    return { error: 'Failed to update profile details.' };
  }
}

export async function changeStudentPassword(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'Student') {
    return { error: 'Unauthorized: Student access required.' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All password fields are required.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New password and confirmation password do not match.' };
  }

  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters long.' };
  }

  // Enforce complexity
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user) {
      return { error: 'User account not found.' };
    }

    // Verify current password
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(currentPassword, user.password);
    } else {
      isMatch = user.password === currentPassword;
    }

    if (!isMatch) {
      return { error: 'Current password is incorrect.' };
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword }
    });

    return { success: true, message: 'Password updated successfully! Next login will require your new credentials.' };
  } catch (error) {
    console.error('Error changing student password:', error);
    return { error: 'An unexpected error occurred while changing password.' };
  }
}

