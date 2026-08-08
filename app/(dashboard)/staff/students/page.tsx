import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import StaffStudentsClient, { StudentItem, CourseOption } from './StaffStudentsClient';

export default async function ViewStudentsPage() {
  const session = await getSession();

  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    redirect('/login');
  }

  // 1. Fetch user & staff profile
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      staffProfile: {
        include: {
          courses: {
            orderBy: { code: 'asc' }
          }
        }
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  let assignedCourses: CourseOption[] = [];
  let courseIds: string[] = [];

  if (user.staffProfile?.courses && user.staffProfile.courses.length > 0) {
    assignedCourses = user.staffProfile.courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      level: c.level
    }));
    courseIds = assignedCourses.map((c) => c.id);
  } else {
    // Fallback: If no courses assigned to this staff directly, fetch all courses for search options
    const allCourses = await prisma.course.findMany({
      orderBy: { code: 'asc' }
    });
    assignedCourses = allCourses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      level: c.level
    }));
    courseIds = assignedCourses.map((c) => c.id);
  }

  // 2. Fetch CourseRegistrations for assigned courses
  const registrations = await prisma.courseRegistration.findMany({
    where: courseIds.length > 0 ? { courseId: { in: courseIds } } : {},
    include: {
      student: {
        include: {
          user: true
        }
      },
      course: true
    },
    orderBy: [
      { student: { matricNumber: 'asc' } },
      { course: { code: 'asc' } }
    ]
  });

  // Map to group registrations per student
  const studentMap = new Map<string, StudentItem>();

  for (const reg of registrations) {
    const s = reg.student;
    if (!studentMap.has(s.id)) {
      studentMap.set(s.id, {
        id: s.id,
        userId: s.userId,
        matricNumber: s.matricNumber,
        firstName: s.user.firstName,
        lastName: s.user.lastName,
        email: s.user.email,
        phone: s.user.phone,
        level: s.level,
        academicSession: s.academicSession,
        passportPhotoUrl: s.passportPhotoUrl,
        courses: []
      });
    }

    const studentItem = studentMap.get(s.id)!;
    studentItem.courses.push({
      registrationId: reg.id,
      courseId: reg.course.id,
      courseCode: reg.course.code,
      courseTitle: reg.course.title,
      status: reg.status,
      semester: reg.course.semester,
      academicSession: reg.academicSession
    });
  }

  let studentsList = Array.from(studentMap.values());
  let isDepartmentRosterFallback = false;

  // If no registrations found, query all student profiles so the roster isn't empty
  if (studentsList.length === 0) {
    isDepartmentRosterFallback = true;
    const allStudentProfiles = await prisma.studentProfile.findMany({
      include: {
        user: true,
        courseRegistrations: {
          include: {
            course: true
          }
        }
      },
      orderBy: { matricNumber: 'asc' }
    });

    studentsList = allStudentProfiles.map((s) => ({
      id: s.id,
      userId: s.userId,
      matricNumber: s.matricNumber,
      firstName: s.user.firstName,
      lastName: s.user.lastName,
      email: s.user.email,
      phone: s.user.phone,
      level: s.level,
      academicSession: s.academicSession,
      passportPhotoUrl: s.passportPhotoUrl,
      courses: s.courseRegistrations.map((cr) => ({
        registrationId: cr.id,
        courseId: cr.course.id,
        courseCode: cr.course.code,
        courseTitle: cr.course.title,
        status: cr.status,
        semester: cr.course.semester,
        academicSession: cr.academicSession
      }))
    }));
  }

  return (
    <StaffStudentsClient
      students={studentsList}
      assignedCourses={assignedCourses}
      isDepartmentRosterFallback={isDepartmentRosterFallback}
    />
  );
}

