import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import UploadResultsClient from './UploadResultsClient';

interface Props {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function UploadResultsPage({ searchParams }: Props) {
  const session = await getSession();
  
  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    redirect('/login');
  }

  const { courseId } = await searchParams;

  const staffUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { staffProfile: true }
  });

  if (!staffUser) {
    redirect('/login');
  }

  const staffProfile = staffUser.staffProfile;

  // 1. Fetch courses specifically assigned to this staff member
  let assignedCourses = staffProfile
    ? await prisma.course.findMany({
        where: { lecturerId: staffProfile.id },
        orderBy: { code: 'asc' }
      })
    : [];

  // 2. If no courses are directly assigned, or user is Admin/HOD, fallback to all courses
  if (assignedCourses.length === 0) {
    assignedCourses = await prisma.course.findMany({
      orderBy: { code: 'asc' }
    });
  }

  return (
    <UploadResultsClient 
      assignedCourses={assignedCourses} 
      initialCourseId={courseId || ''} 
    />
  );
}

