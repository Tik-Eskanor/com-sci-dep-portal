export type Role = 'Public' | 'Student' | 'Staff' | 'Admin';

export interface User {
  id: string;
  role: Role;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

export interface Student extends User {
  role: 'Student';
  matricNumber: string;
  level: 'ND1' | 'ND2' | 'HND1' | 'HND2';
  academicSession: string;
  passportPhotoUrl?: string;
}

export interface Staff extends User {
  role: 'Staff' | 'Admin';
  staffId: string;
  title: string; // e.g., "Dr.", "Prof.", "Mr."
  specialization: string;
  officeHours: string;
  assignedCourses: string[]; // Course IDs
}

export interface Course {
  id: string;
  code: string; // e.g., "COM 111"
  title: string;
  creditUnits: number;
  semester: 'First' | 'Second';
  level: 'ND1' | 'ND2' | 'HND1' | 'HND2';
  isElective: boolean;
  lecturerId?: string; // Reference to Staff
}

export interface Result {
  id: string;
  studentId: string; // Reference to Student
  courseId: string; // Reference to Course
  academicSession: string;
  caScore: number; // Continuous Assessment (max 30 or 40 depending on poly, assume 40)
  examScore: number; // Exam (max 60)
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  gradePoint: number; // 4.0, 3.5, 3.0, 2.5, 2.0, 0.0
  isApproved: boolean; // Must be approved by Admin before student can view
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string; // Reference to Staff/Admin
  publishedAt: string;
  isUrgent: boolean;
  targetAudience: 'All' | 'Staff' | 'Students' | 'ND1' | 'ND2' | 'HND1' | 'HND2';
}

export interface LearningMaterial {
  id: string;
  title: string;
  description?: string;
  courseId: string; // Reference to Course
  uploadedById: string; // Reference to Staff
  fileUrl: string;
  fileType: string; // e.g., 'pdf', 'docx', 'zip'
  uploadedAt: string;
}
