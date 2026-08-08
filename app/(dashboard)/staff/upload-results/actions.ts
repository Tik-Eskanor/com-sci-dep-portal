'use server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function getRegisteredStudents(courseId: string, academicSession: string) {
  const session = await getSession();
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    return { error: 'Unauthorized access.' };
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return { error: 'Course not found.' };
    }

    // 1. Fetch course registrations for this course and session
    const registrations = await prisma.courseRegistration.findMany({
      where: {
        courseId,
        academicSession,
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        student: {
          matricNumber: 'asc'
        }
      }
    });

    // 2. Fetch existing results for this course and session
    const existingResults = await prisma.result.findMany({
      where: {
        courseId,
        academicSession
      },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    });

    // Build a map of studentId -> student data
    const studentMap = new Map<string, {
      studentId: string;
      matricNumber: string;
      name: string;
      level: string;
      caScore: number;
      examScore: number;
      isApproved: boolean;
      registrationStatus: string;
    }>();

    // Populate from registrations
    for (const reg of registrations) {
      const existing = existingResults.find(r => r.studentId === reg.studentId);
      studentMap.set(reg.studentId, {
        studentId: reg.studentId,
        matricNumber: reg.student.matricNumber,
        name: `${reg.student.user.firstName} ${reg.student.user.lastName}`,
        level: reg.student.level,
        caScore: existing?.caScore ?? 0,
        examScore: existing?.examScore ?? 0,
        isApproved: existing?.isApproved ?? false,
        registrationStatus: reg.status
      });
    }

    // Include any existing results even if registration wasn't explicitly found
    for (const res of existingResults) {
      if (!studentMap.has(res.studentId)) {
        studentMap.set(res.studentId, {
          studentId: res.studentId,
          matricNumber: res.student.matricNumber,
          name: `${res.student.user.firstName} ${res.student.user.lastName}`,
          level: res.student.level,
          caScore: res.caScore,
          examScore: res.examScore,
          isApproved: res.isApproved,
          registrationStatus: 'Approved'
        });
      }
    }

    // Fallback: If no students registered yet for this specific course, load students in the course's level
    if (studentMap.size === 0) {
      const levelStudents = await prisma.studentProfile.findMany({
        where: {
          level: course.level
        },
        include: {
          user: true
        },
        orderBy: {
          matricNumber: 'asc'
        },
        take: 50
      });

      for (const st of levelStudents) {
        studentMap.set(st.id, {
          studentId: st.id,
          matricNumber: st.matricNumber,
          name: `${st.user.firstName} ${st.user.lastName}`,
          level: st.level,
          caScore: 0,
          examScore: 0,
          isApproved: false,
          registrationStatus: 'Auto-Loaded'
        });
      }
    }

    const students = Array.from(studentMap.values()).sort((a, b) => 
      a.matricNumber.localeCompare(b.matricNumber)
    );

    return { 
      course,
      students 
    };
  } catch (error) {
    console.error('getRegisteredStudents error:', error);
    return { error: 'Failed to fetch student grading sheet.' };
  }
}

export async function addStudentByMatric(courseId: string, academicSession: string, matricNumber: string) {
  const session = await getSession();
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    return { error: 'Unauthorized' };
  }

  try {
    const student = await prisma.studentProfile.findFirst({
      where: {
        matricNumber: {
          equals: matricNumber.trim(),
          mode: 'insensitive'
        }
      },
      include: {
        user: true
      }
    });

    if (!student) {
      return { error: `Student with Matric Number "${matricNumber}" was not found.` };
    }

    // Check existing result
    const existingResult = await prisma.result.findUnique({
      where: {
        studentId_courseId_academicSession: {
          studentId: student.id,
          courseId,
          academicSession
        }
      }
    });

    return {
      student: {
        studentId: student.id,
        matricNumber: student.matricNumber,
        name: `${student.user.firstName} ${student.user.lastName}`,
        level: student.level,
        caScore: existingResult?.caScore ?? 0,
        examScore: existingResult?.examScore ?? 0,
        isApproved: existingResult?.isApproved ?? false,
        registrationStatus: 'Manually Added'
      }
    };
  } catch (error) {
    console.error('addStudentByMatric error:', error);
    return { error: 'Error finding student.' };
  }
}

export async function saveResults(
  courseId: string, 
  academicSession: string, 
  results: { studentId: string; caScore: number; examScore: number }[]
) {
  const session = await getSession();
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    return { error: 'Unauthorized access.' };
  }

  if (!courseId) {
    return { error: 'Please select a valid course.' };
  }

  try {
    let savedCount = 0;

    for (const r of results) {
      const caScore = Math.min(40, Math.max(0, Number(r.caScore) || 0));
      const examScore = Math.min(60, Math.max(0, Number(r.examScore) || 0));
      const totalScore = caScore + examScore;

      let grade = 'F';
      let gradePoint = 0.0;

      if (totalScore >= 75) { grade = 'A'; gradePoint = 4.0; }
      else if (totalScore >= 70) { grade = 'AB'; gradePoint = 3.5; }
      else if (totalScore >= 65) { grade = 'B'; gradePoint = 3.0; }
      else if (totalScore >= 60) { grade = 'BC'; gradePoint = 2.5; }
      else if (totalScore >= 55) { grade = 'C'; gradePoint = 2.0; }
      else if (totalScore >= 50) { grade = 'CD'; gradePoint = 1.5; }
      else if (totalScore >= 45) { grade = 'D'; gradePoint = 1.0; }
      else if (totalScore >= 40) { grade = 'E'; gradePoint = 0.5; }

      await prisma.result.upsert({
        where: {
          studentId_courseId_academicSession: {
            studentId: r.studentId,
            courseId,
            academicSession
          }
        },
        update: {
          caScore,
          examScore,
          totalScore,
          grade,
          gradePoint,
          isApproved: false // Requires HOD approval
        },
        create: {
          studentId: r.studentId,
          courseId,
          academicSession,
          caScore,
          examScore,
          totalScore,
          grade,
          gradePoint,
          isApproved: false
        }
      });
      savedCount++;
    }

    return { 
      success: true, 
      message: `Successfully saved ${savedCount} student result records! Submitted to HOD for approval.` 
    };
  } catch (error) {
    console.error('saveResults error:', error);
    return { error: 'Failed to save results. Please check entries and try again.' };
  }
}

