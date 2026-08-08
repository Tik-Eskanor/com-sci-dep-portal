import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CourseRegistrationClient from './CourseRegistrationClient';

export default async function CourseRegistrationPage() {
  const session = await getSession();
  
  if (!session || session.role !== 'Student') {
    redirect('/login');
  }

  const student = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { studentProfile: true }
  });

  if (!student || !student.studentProfile) {
    redirect('/login');
  }

  const { level, academicSession } = student.studentProfile;

  const availableCourses = await prisma.course.findMany({
    where: {
      level,
    },
    orderBy: { code: 'asc' }
  });

  const registeredCourses = await prisma.courseRegistration.findMany({
    where: {
      studentId: student.studentProfile.id,
      academicSession
    },
    select: {
      courseId: true,
      status: true,
      semester: true
    }
  });

  return (
    <CourseRegistrationClient 
      availableCourses={availableCourses}
      registeredCourses={registeredCourses}
      studentLevel={level}
      academicSession={academicSession}
      studentName={`${student.firstName} ${student.lastName}`}
      matricNumber={student.studentProfile.matricNumber}
      passportPhotoUrl={student.studentProfile.passportPhotoUrl || undefined}
    />
  );
}
