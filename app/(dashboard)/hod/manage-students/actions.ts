'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Level } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function createStudent(formData: FormData) {
  try {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = (formData.get('phone') as string) || '';
    const matricNumber = formData.get('matricNumber') as string;
    const level = formData.get('level') as Level;
    const academicSession = formData.get('academicSession') as string;
    const defaultPassword = formData.get('password') as string || 'password123';
    
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: hashedPassword,
        role: 'Student',
        studentProfile: {
          create: {
            matricNumber,
            level,
            academicSession,
          }
        }
      }
    });

    revalidatePath('/hod/manage-students');
    return { success: true };
  } catch (error) {
    console.error('Error creating student:', error);
    return { success: false, error: 'Failed to create student. Email or Matric Number might already exist.' };
  }
}

export async function updateStudent(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = (formData.get('phone') as string) || '';
    const matricNumber = formData.get('matricNumber') as string;
    const level = formData.get('level') as Level;
    const academicSession = formData.get('academicSession') as string;
    
    // Check if password needs to be updated
    const password = formData.get('password') as string;
    
    let updateData: any = {
      firstName,
      lastName,
      email,
      phone,
      studentProfile: {
        update: {
          matricNumber,
          level,
          academicSession,
        }
      }
    };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    await prisma.user.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/hod/manage-students');
    return { success: true };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: 'Failed to update student.' };
  }
}

export async function deleteStudent(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    revalidatePath('/hod/manage-students');
    return { success: true };
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: 'Failed to delete student.' };
  }
}
