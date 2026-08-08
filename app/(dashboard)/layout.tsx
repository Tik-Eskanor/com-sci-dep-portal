import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import DashboardLayoutClient from '@/components/DashboardLayoutClient';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  let userRole = session?.role || 'Guest';
  let userName = session?.email || 'User';
  let userFirstName = '';
  let userLastName = '';
  let userImage: string | null = null;
  let userIdString = session?.userId ? `ID: ${session.userId.substring(0, 6)}` : '';

  if (session?.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: {
          studentProfile: true,
          staffProfile: true,
        },
      });

      if (user) {
        userRole = user.role;
        userFirstName = user.firstName || '';
        userLastName = user.lastName || '';
        userName = `${user.firstName} ${user.lastName}`.trim() || user.email;

        if (user.studentProfile) {
          userImage = user.studentProfile.passportPhotoUrl || null;
          if (user.studentProfile.matricNumber) {
            userIdString = user.studentProfile.matricNumber;
          }
        } else if (user.staffProfile) {
          if (user.staffProfile.staffId) {
            userIdString = user.staffProfile.staffId;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching layout user details:', e);
    }
  }

  return (
    <DashboardLayoutClient
      userRole={userRole}
      userName={userName}
      userFirstName={userFirstName}
      userLastName={userLastName}
      userImage={userImage}
      userIdString={userIdString}
    >
      {children}
    </DashboardLayoutClient>
  );
}
