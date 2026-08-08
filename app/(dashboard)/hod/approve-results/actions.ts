'use server';

import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function approveCourseResults(courseId: string, academicSession: string) {
  const session = await getSession();
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    return { error: 'Unauthorized access. Only HOD or Admin can approve departmental results.' };
  }

  try {
    const updated = await prisma.result.updateMany({
      where: {
        courseId,
        academicSession,
      },
      data: {
        isApproved: true,
      },
    });

    revalidatePath('/hod/approve-results');
    revalidatePath('/staff/upload-results');
    revalidatePath('/student/results');

    return {
      success: true,
      message: `Successfully approved ${updated.count} student result records for this course!`,
    };
  } catch (error) {
    console.error('approveCourseResults error:', error);
    return { error: 'Failed to approve course results.' };
  }
}

export async function revokeCourseResults(courseId: string, academicSession: string) {
  const session = await getSession();
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    return { error: 'Unauthorized access.' };
  }

  try {
    const updated = await prisma.result.updateMany({
      where: {
        courseId,
        academicSession,
      },
      data: {
        isApproved: false,
      },
    });

    revalidatePath('/hod/approve-results');
    revalidatePath('/staff/upload-results');
    revalidatePath('/student/results');

    return {
      success: true,
      message: `Approval revoked for ${updated.count} result records. Status returned to Pending.`,
    };
  } catch (error) {
    console.error('revokeCourseResults error:', error);
    return { error: 'Failed to revoke course result approval.' };
  }
}

export async function batchApproveAllPendingResults(academicSession: string) {
  const session = await getSession();
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    return { error: 'Unauthorized access.' };
  }

  try {
    const updated = await prisma.result.updateMany({
      where: {
        academicSession,
        isApproved: false,
      },
      data: {
        isApproved: true,
      },
    });

    revalidatePath('/hod/approve-results');
    revalidatePath('/staff/upload-results');
    revalidatePath('/student/results');

    return {
      success: true,
      message: `Batch approved ${updated.count} pending student result records for ${academicSession}!`,
    };
  } catch (error) {
    console.error('batchApproveAllPendingResults error:', error);
    return { error: 'Failed to execute batch approval.' };
  }
}

export async function getCourseDetailedResults(courseId: string, academicSession: string) {
  const session = await getSession();
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    return { error: 'Unauthorized access.' };
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!course) {
      return { error: 'Course not found.' };
    }

    const results = await prisma.result.findMany({
      where: {
        courseId,
        academicSession,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        student: {
          matricNumber: 'asc',
        },
      },
    });

    return {
      course,
      results: results.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        matricNumber: r.student.matricNumber,
        studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
        level: r.student.level,
        caScore: r.caScore,
        examScore: r.examScore,
        totalScore: r.totalScore,
        grade: r.grade,
        gradePoint: r.gradePoint,
        isApproved: r.isApproved,
      })),
    };
  } catch (error) {
    console.error('getCourseDetailedResults error:', error);
    return { error: 'Failed to fetch detailed results for inspection.' };
  }
}

export async function toggleSingleResultApproval(resultId: string, newApprovalState: boolean) {
  const session = await getSession();
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    return { error: 'Unauthorized access.' };
  }

  try {
    const updated = await prisma.result.update({
      where: { id: resultId },
      data: { isApproved: newApprovalState },
    });

    revalidatePath('/hod/approve-results');
    revalidatePath('/student/results');

    return {
      success: true,
      isApproved: updated.isApproved,
      message: `Result status updated to ${updated.isApproved ? 'Approved' : 'Pending'}.`,
    };
  } catch (error) {
    console.error('toggleSingleResultApproval error:', error);
    return { error: 'Failed to update result approval.' };
  }
}
