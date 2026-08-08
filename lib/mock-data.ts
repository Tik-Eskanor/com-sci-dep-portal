import { Course, Staff, Announcement, LearningMaterial } from '../types';

export const mockStaff: Staff[] = [
  {
    id: 'staff-1',
    role: 'Admin',
    email: 'hod@polyibadan.edu.ng',
    firstName: 'Oluwafemi',
    lastName: 'Adebayo',
    staffId: 'STF/CS/001',
    title: 'Dr.',
    specialization: 'Artificial Intelligence & Data Science',
    officeHours: 'Mon & Wed, 10:00 AM - 12:00 PM',
    assignedCourses: ['COM311', 'COM412'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'staff-2',
    role: 'Staff',
    email: 'j.oyedele@polyibadan.edu.ng',
    firstName: 'Jumoke',
    lastName: 'Oyedele',
    staffId: 'STF/CS/042',
    title: 'Mrs.',
    specialization: 'Software Engineering & Web Development',
    officeHours: 'Tue & Thu, 1:00 PM - 3:00 PM',
    assignedCourses: ['COM113', 'COM215'],
    createdAt: new Date().toISOString(),
  }
];

export const mockCourses: Course[] = [
  {
    id: 'COM111',
    code: 'COM 111',
    title: 'Introduction to Computing',
    creditUnits: 3,
    semester: 'First',
    level: 'ND1',
    isElective: false,
    lecturerId: 'staff-2'
  },
  {
    id: 'COM113',
    code: 'COM 113',
    title: 'Introduction to Programming (C++)',
    creditUnits: 3,
    semester: 'First',
    level: 'ND1',
    isElective: false,
    lecturerId: 'staff-2'
  },
  {
    id: 'COM311',
    code: 'COM 311',
    title: 'Operating Systems I',
    creditUnits: 3,
    semester: 'First',
    level: 'HND1',
    isElective: false,
    lecturerId: 'staff-1'
  },
  {
    id: 'COM412',
    code: 'COM 412',
    title: 'Database Design III',
    creditUnits: 3,
    semester: 'First',
    level: 'HND2',
    isElective: false,
    lecturerId: 'staff-1'
  }
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Submission of Course Registration Forms',
    content: 'All ND1 and HND1 students are expected to submit their printed and signed course registration forms to the departmental office on or before Friday.',
    authorId: 'staff-1',
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    isUrgent: true,
    targetAudience: 'All'
  },
  {
    id: 'ann-2',
    title: 'COM 113 Lecture Rescheduled',
    content: 'Please be informed that the COM 113 lecture for tomorrow has been moved from 10:00 AM to 2:00 PM at the CS Lab 2.',
    authorId: 'staff-2',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    isUrgent: false,
    targetAudience: 'ND1'
  }
];
