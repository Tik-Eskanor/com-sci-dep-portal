import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CourseApprovalsClient from './CourseApprovalsClient';

export default async function CourseApprovalsPage() {
  const session = await getSession();
  
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    redirect('/login');
  }

  // Get all unique combinations of student, session, and semester
  // Since Prisma doesn't have a direct distinct query with relations that's easy to map,
  // we can fetch all registrations and group them in JS, or we can use groupBy.
  // Grouping in JS is fine for this scale.
  const allRegistrations = await prisma.courseRegistration.findMany({
    include: {
      student: {
        include: {
          user: true
        }
      },
      course: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Group by studentId + academicSession + semester
  const grouped = new Map<string, any>();
  
  allRegistrations.forEach(reg => {
    const key = `${reg.studentId}-${reg.academicSession}-${reg.semester}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        studentId: reg.studentId,
        studentName: `${reg.student.user.firstName} ${reg.student.user.lastName}`,
        matricNumber: reg.student.matricNumber,
        level: reg.student.level,
        academicSession: reg.academicSession,
        semester: reg.semester,
        totalCredits: 0,
        courses: [],
        status: 'Pending' // We'll compute overall status
      });
    }
    
    const group = grouped.get(key);
    group.totalCredits += reg.course.creditUnits;
    group.courses.push(reg);
    
    // Overall status logic: if any pending, it's pending. If any rejected, it's rejected. Else approved.
  });

  grouped.forEach(group => {
    const statuses = group.courses.map((c: any) => c.status);
    if (statuses.includes('Pending')) {
      group.status = 'Pending';
    } else if (statuses.includes('Rejected')) {
      group.status = 'Rejected';
    } else {
      group.status = 'Approved';
    }
  });

  const registrationsList = Array.from(grouped.values());

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--color-poly-text-heading)] mb-6">Course Registration Approvals</h1>
      <CourseApprovalsClient initialRegistrations={registrationsList} />
    </div>
  );
}
