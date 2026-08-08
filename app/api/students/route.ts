import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'Student' },
      include: {
        studentProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Flatten the response for easier consumption in the frontend
    const flatStudents = students.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      matricNumber: user.studentProfile?.matricNumber || '',
      level: user.studentProfile?.level || '',
      academicSession: user.studentProfile?.academicSession || '',
    }));

    return NextResponse.json(flatStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
