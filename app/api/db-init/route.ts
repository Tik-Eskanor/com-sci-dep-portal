import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    // 1. Push schema
    const output = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf-8' });
    
    // 2. Create a default admin user and student for testing
    const adminPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@poly.edu.ng' },
      update: {},
      create: {
        email: 'admin@poly.edu.ng',
        password: adminPassword,
        firstName: 'System',
        lastName: 'Admin',
        role: 'Admin',
        staffProfile: {
          create: {
            staffId: 'ADMIN/001',
            title: 'Mr.',
            specialization: 'System Administration',
            officeHours: 'Mon-Fri 9AM-5PM'
          }
        }
      }
    });

    const student = await prisma.user.upsert({
      where: { email: 'student@poly.edu.ng' },
      update: {},
      create: {
        email: 'student@poly.edu.ng',
        password: studentPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'Student',
        studentProfile: {
          create: {
            matricNumber: 'CS/ND2/24/001',
            level: 'ND2',
            academicSession: '2024/2025'
          }
        }
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database schema synchronized and seed data created successfully!', 
      output,
      credentials: {
        student: { matric: 'CS/ND2/24/001', password: 'student123' },
        admin: { staffId: 'ADMIN/001', password: 'admin123' }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, output: error.stdout?.toString() }, { status: 500 });
  }
}
