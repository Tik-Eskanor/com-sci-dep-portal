'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function updateCourseRegistrationStatus(studentId: string, academicSession: string, semester: string, status: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.courseRegistration.updateMany({
      where: {
        studentId,
        academicSession,
        semester: semester as any
      },
      data: {
        status
      }
    });

    revalidatePath('/staff/course-approvals');
    revalidatePath('/student/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
