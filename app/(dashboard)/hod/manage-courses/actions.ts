'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Level, Semester } from '@prisma/client';

export async function createCourse(formData: FormData) {
  try {
    const code = formData.get('code') as string;
    const title = formData.get('title') as string;
    const creditUnits = parseInt(formData.get('creditUnits') as string, 10);
    const semester = formData.get('semester') as Semester;
    const level = formData.get('level') as Level;
    const category = formData.get('category') as string;
    
    await prisma.course.create({
      data: {
        code,
        title,
        creditUnits,
        semester,
        level,
        category,
        isElective: category === 'E',
      }
    });

    revalidatePath('/hod/manage-courses');
    return { success: true };
  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, error: 'Failed to create course. Code might already exist.' };
  }
}

export async function updateCourse(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const code = formData.get('code') as string;
    const title = formData.get('title') as string;
    const creditUnits = parseInt(formData.get('creditUnits') as string, 10);
    const semester = formData.get('semester') as Semester;
    const level = formData.get('level') as Level;
    const category = formData.get('category') as string;

    await prisma.course.update({
      where: { id },
      data: {
        code,
        title,
        creditUnits,
        semester,
        level,
        category,
        isElective: category === 'E',
      }
    });

    revalidatePath('/hod/manage-courses');
    return { success: true };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: 'Failed to update course.' };
  }
}

export async function deleteCourse(id: string) {
  try {
    await prisma.course.delete({
      where: { id }
    });
    revalidatePath('/hod/manage-courses');
    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error: 'Failed to delete course.' };
  }
}
