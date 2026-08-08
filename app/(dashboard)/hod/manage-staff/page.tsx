import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ManageStaffClient from './ManageStaffClient';
import { getStaffMembers } from './actions';

export default async function ManageStaffPage() {
  const session = await getSession();
  
  if (!session || session.role !== 'Admin') {
    redirect('/login');
  }

  const res = await getStaffMembers();
  
  if (res.error) {
    return <div>Error loading staff members.</div>;
  }

  const courses = await prisma.course.findMany({
    orderBy: { code: 'asc' },
    select: { id: true, code: true, title: true }
  });

  return <ManageStaffClient initialStaff={res.staff || []} courses={courses} />;
}
