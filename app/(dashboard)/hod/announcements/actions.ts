'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

async function ensureAuthorProfile(userId: string) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { staffProfile: true }
  });

  if (!user) return null;

  if (user.staffProfile) {
    return user.staffProfile.id;
  }

  // Create staff profile if missing
  const staffProfile = await prisma.staffProfile.create({
    data: {
      userId: user.id,
      staffId: `STF/HOD/${user.id.slice(0, 5).toUpperCase()}`,
      title: 'Dr.',
      specialization: 'Computer Science & Departmental Administration',
      officeHours: 'Mon-Fri 9:00 AM - 4:00 PM'
    }
  });

  return staffProfile.id;
}

export async function getAnnouncements() {
  try {
    let announcements = await prisma.announcement.findMany({
      include: {
        author: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Auto-seed initial announcements if empty
    if (announcements.length === 0) {
      const session = await getSession();
      let authorId: string | null = null;
      if (session?.userId) {
        authorId = await ensureAuthorProfile(session.userId);
      }

      if (!authorId) {
        const anyStaff = await prisma.staffProfile.findFirst();
        if (anyStaff) {
          authorId = anyStaff.id;
        } else {
          // Create dummy HOD staff
          const hodUser = await prisma.user.create({
            data: {
              firstName: 'Oluwafemi',
              lastName: 'Adebayo',
              email: 'hod.announcements@polyibadan.edu.ng',
              password: 'password123',
              role: 'Admin',
              staffProfile: {
                create: {
                  staffId: 'STF/CS/HOD',
                  title: 'Dr.',
                  specialization: 'Artificial Intelligence & Administration',
                  officeHours: 'Mon & Wed 10:00 AM - 12:00 PM'
                }
              }
            },
            include: { staffProfile: true }
          });
          authorId = hodUser.staffProfile!.id;
        }
      }

      await prisma.announcement.createMany({
        data: [
          {
            title: 'Submission of Course Registration Forms',
            content: 'All ND1, ND2, HND1 and HND2 students are required to submit their signed course registration forms to the departmental office before Friday.',
            targetAudience: 'All Students',
            isUrgent: true,
            authorId: authorId!
          },
          {
            title: 'Departmental Workshop on AI & Cloud Computing',
            content: 'The Department of Computer Science invites all final year ND2 and HND2 students to a hands-on workshop on Cloud Computing & AI applications in CS Lab 1.',
            targetAudience: 'HND2 & ND2',
            isUrgent: false,
            authorId: authorId!
          },
          {
            title: 'Staff Academic Planning Committee Meeting',
            content: 'All academic staff members are notified of an emergency curriculum review meeting scheduled for Thursday at 11:00 AM in the HOD Conference Room.',
            targetAudience: 'Staff',
            isUrgent: false,
            authorId: authorId!
          }
        ]
      });

      announcements = await prisma.announcement.findMany({
        include: {
          author: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        }
      });
    }

    return { announcements };
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return { error: 'Failed to fetch announcements.' };
  }
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  targetAudience: string;
  isUrgent: boolean;
}) {
  const session = await getSession();
  if (!session || (session.role !== 'Admin' && session.role !== 'Staff')) {
    return { error: 'Unauthorized. Only HOD and staff can manage announcements.' };
  }

  if (!data.title?.trim() || !data.content?.trim()) {
    return { error: 'Announcement title and content are required.' };
  }

  try {
    const authorId = await ensureAuthorProfile(session.userId);
    if (!authorId) {
      return { error: 'Could not resolve author profile.' };
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        targetAudience: data.targetAudience || 'All Students & Staff',
        isUrgent: !!data.isUrgent,
        authorId: authorId
      }
    });

    revalidatePath('/');
    revalidatePath('/hod/announcements');
    revalidatePath('/hod/dashboard');

    return { success: true, announcement };
  } catch (error) {
    console.error('Failed to create announcement:', error);
    return { error: 'Failed to create announcement.' };
  }
}

export async function updateAnnouncement(id: string, data: {
  title: string;
  content: string;
  targetAudience: string;
  isUrgent: boolean;
}) {
  const session = await getSession();
  if (!session || (session.role !== 'Admin' && session.role !== 'Staff')) {
    return { error: 'Unauthorized.' };
  }

  if (!data.title?.trim() || !data.content?.trim()) {
    return { error: 'Announcement title and content are required.' };
  }

  try {
    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: data.title.trim(),
        content: data.content.trim(),
        targetAudience: data.targetAudience || 'All Students & Staff',
        isUrgent: !!data.isUrgent
      }
    });

    revalidatePath('/');
    revalidatePath('/hod/announcements');
    revalidatePath('/hod/dashboard');

    return { success: true, announcement };
  } catch (error) {
    console.error('Failed to update announcement:', error);
    return { error: 'Failed to update announcement.' };
  }
}

export async function deleteAnnouncement(id: string) {
  const session = await getSession();
  if (!session || (session.role !== 'Admin' && session.role !== 'Staff')) {
    return { error: 'Unauthorized.' };
  }

  try {
    await prisma.announcement.delete({
      where: { id }
    });

    revalidatePath('/');
    revalidatePath('/hod/announcements');
    revalidatePath('/hod/dashboard');

    return { success: true };
  } catch (error) {
    console.error('Failed to delete announcement:', error);
    return { error: 'Failed to delete announcement.' };
  }
}
