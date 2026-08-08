'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getStaffMembers() {
  const session = await getSession();
  if (!session || session.role !== 'Admin') return { error: 'Unauthorized' };

  try {
    const staff = await prisma.user.findMany({
      where: {
        role: { in: ['Staff', 'Admin'] },
        staffProfile: { isNot: null }
      },
      include: {
        staffProfile: {
          include: {
            courses: true
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });
    return { staff };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to fetch staff members.' };
  }
}

export async function addStaffMember(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  staffId: string;
  title: string;
  specialization: string;
  officeHours: string;
  role: 'Staff' | 'Admin';
  courseId?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== 'Admin') return { error: 'Unauthorized' };

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) return { error: 'Email already exists.' };

    const existingStaffId = await prisma.staffProfile.findUnique({ where: { staffId: data.staffId } });
    if (existingStaffId) return { error: 'Staff ID already exists.' };

    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword, // Default hashed password
        role: data.role,
        staffProfile: {
          create: {
            staffId: data.staffId,
            title: data.title,
            specialization: data.specialization,
            officeHours: data.officeHours
          }
        }
      },
      include: {
        staffProfile: true
      }
    });

    if (data.courseId && user.staffProfile) {
      await prisma.course.update({
        where: { id: data.courseId },
        data: { lecturerId: user.staffProfile.id }
      });
    }

    revalidatePath('/hod/manage-staff');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to add staff member.' };
  }
}

export async function updateStaffMember(userId: string, data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  staffId: string;
  title: string;
  specialization: string;
  officeHours: string;
  role: 'Staff' | 'Admin';
  courseId?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== 'Admin') return { error: 'Unauthorized' };

  try {
    // Check if another user has the email
    const existingUser = await prisma.user.findFirst({ where: { email: data.email, id: { not: userId } } });
    if (existingUser) return { error: 'Email already exists.' };

    const userToUpdate = await prisma.user.findUnique({ where: { id: userId }, include: { staffProfile: true } });
    if (!userToUpdate || !userToUpdate.staffProfile) return { error: 'Staff member not found.' };

    // Check if another staff has the staffId
    const existingStaffId = await prisma.staffProfile.findFirst({ where: { staffId: data.staffId, userId: { not: userId } } });
    if (existingStaffId) return { error: 'Staff ID already exists.' };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        staffProfile: {
          update: {
            staffId: data.staffId,
            title: data.title,
            specialization: data.specialization,
            officeHours: data.officeHours
          }
        }
      },
      include: {
        staffProfile: true
      }
    });

    // Remove existing course assignments if needed, or just update the selected one
    if (data.courseId && updatedUser.staffProfile) {
      await prisma.course.update({
        where: { id: data.courseId },
        data: { lecturerId: updatedUser.staffProfile.id }
      });
    }

    revalidatePath('/hod/manage-staff');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to update staff member.' };
  }
}

export async function deleteStaffMember(userId: string) {
  const session = await getSession();
  if (!session || session.role !== 'Admin') return { error: 'Unauthorized.' };

  if (session.userId === userId) {
    return { error: 'You cannot delete your own logged-in account.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { staffProfile: true }
    });

    if (!user) {
      return { error: 'Staff member not found.' };
    }

    await prisma.$transaction(async (tx) => {
      if (user.staffProfile) {
        const staffProfileId = user.staffProfile.id;

        // 1. Unassign courses
        await tx.course.updateMany({
          where: { lecturerId: staffProfileId },
          data: { lecturerId: null }
        });

        // 2. Delete announcements authored by this staff
        await tx.announcement.deleteMany({
          where: { authorId: staffProfileId }
        });

        // 3. Delete learning materials uploaded by this staff
        await tx.learningMaterial.deleteMany({
          where: { uploadedById: staffProfileId }
        });

        // 4. Delete staff profile explicitly
        await tx.staffProfile.delete({
          where: { id: staffProfileId }
        });
      }

      // 5. Delete user
      await tx.user.delete({
        where: { id: userId }
      });
    });

    revalidatePath('/hod/manage-staff');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting staff member:', error);
    return { error: error?.message || 'Failed to delete staff member.' };
  }
}
