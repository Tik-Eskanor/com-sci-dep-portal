'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function registerCourses(courseIds: string[], currentSemester: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'Student') {
      return { success: false, error: 'Unauthorized' };
    }

    const student = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { studentProfile: true }
    });

    if (!student || !student.studentProfile) {
      return { success: false, error: 'Student profile not found' };
    }

    const { id: studentProfileId, academicSession } = student.studentProfile;

    // Check if the student's registration for this semester is already approved
    const existingApproved = await prisma.courseRegistration.findFirst({
      where: {
        studentId: studentProfileId,
        academicSession,
        semester: currentSemester as any,
        status: 'Approved'
      }
    });

    if (existingApproved) {
      return { success: false, error: 'Registration for this semester is already approved and cannot be modified.' };
    }

    // First delete any existing registrations for this semester/session
    // that are NOT in the new courseIds
    await prisma.courseRegistration.deleteMany({
      where: {
        studentId: studentProfileId,
        academicSession,
        semester: currentSemester as any,
        courseId: {
          notIn: courseIds
        }
      }
    });

    // Then upsert the new registrations
    for (const courseId of courseIds) {
      await prisma.courseRegistration.upsert({
        where: {
          studentId_courseId_academicSession: {
            studentId: studentProfileId,
            courseId,
            academicSession
          }
        },
        update: {
          status: 'Pending'
        },
        create: {
          studentId: studentProfileId,
          courseId,
          academicSession,
          semester: currentSemester as any,
          status: 'Pending'
        }
      });
    }

    revalidatePath('/student/course-registration');
    return { success: true };
  } catch (error) {
    console.error('Error saving course registration:', error);
    return { success: false, error: 'Failed to save course registration' };
  }
}
