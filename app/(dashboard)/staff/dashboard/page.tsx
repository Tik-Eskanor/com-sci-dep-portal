import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight, 
  Briefcase, 
  GraduationCap,
  Calendar,
  Sparkles,
  ChevronRight,
  BarChart3
} from 'lucide-react';

export default async function StaffDashboardPage() {
  const session = await getSession();

  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    redirect('/login');
  }

  // Fetch logged in staff user profile and details
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      staffProfile: {
        include: {
          courses: {
            include: {
              _count: {
                select: {
                  courseRegistrations: true,
                  results: true
                }
              }
            },
            orderBy: { code: 'asc' }
          }
        }
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  const staffProfile = user.staffProfile;
  const assignedCourses = staffProfile?.courses || [];
  const assignedCourseIds = assignedCourses.map(c => c.id);

  // Stats Calculations
  const assignedCoursesCount = assignedCourses.length;

  // 1. Total Enrolled Students (Unique students registered in lecturer's assigned courses)
  let enrolledStudentsCount = 0;
  if (assignedCourseIds.length > 0) {
    const uniqueStudents = await prisma.courseRegistration.findMany({
      where: { courseId: { in: assignedCourseIds } },
      distinct: ['studentId'],
      select: { studentId: true }
    });
    enrolledStudentsCount = uniqueStudents.length;
  } else {
    // If no specific courses assigned yet, fallback to total department students
    enrolledStudentsCount = await prisma.studentProfile.count();
  }

  // 2. Results count for lecturer's courses
  const totalResultsUploaded = await prisma.result.count({
    where: assignedCourseIds.length > 0 ? { courseId: { in: assignedCourseIds } } : {}
  });

  const staffDisplayName = staffProfile 
    ? `${staffProfile.title || 'Lecturer'} ${user.firstName} ${user.lastName}`
    : `${user.firstName} ${user.lastName}`;

  return (
    <div className="space-y-8">
      {/* Welcome & Profile Header */}
      <div className="bg-gradient-to-r from-[var(--color-poly-primary)] to-[var(--color-poly-primary-light)] text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-amber-200 uppercase border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Lecturer Portal • Computer Science
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {staffDisplayName}!
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-slate-100/90 pt-1">
            {staffProfile?.staffId && (
              <span className="flex items-center gap-1.5 font-mono bg-black/20 px-2.5 py-1 rounded text-xs">
                <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                Staff ID: {staffProfile.staffId}
              </span>
            )}
            {staffProfile?.specialization && (
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {staffProfile.specialization}
              </span>
            )}
            {staffProfile?.officeHours && (
              <span className="flex items-center gap-1.5 text-xs text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                Office Hours: {staffProfile.officeHours}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Assigned Courses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Courses
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{assignedCoursesCount}</div>
          <p className="text-xs text-slate-500 mt-1">Courses allocated for teaching</p>
        </div>

        {/* Card 2: Enrolled Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{enrolledStudentsCount}</div>
          <p className="text-xs text-slate-500 mt-1">Students in your course rosters</p>
        </div>

        {/* Card 3: Results Uploaded */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Results Uploaded
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalResultsUploaded}</div>
          <p className="text-xs text-slate-500 mt-1">Student course results recorded</p>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--color-poly-primary)]" />
          Quick Academic Management
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/staff/upload-results"
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-[var(--color-poly-primary)] hover:text-white border border-slate-200 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-slate-700 shadow-2xs group-hover:bg-white/20 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5 text-purple-600 group-hover:text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 group-hover:text-white">Upload Results</div>
                <div className="text-xs text-slate-500 group-hover:text-white/80">Input CA & Exam Scores</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </Link>

          <Link
            href="/staff/course-approvals"
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-[var(--color-poly-primary)] hover:text-white border border-slate-200 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-slate-700 shadow-2xs group-hover:bg-white/20 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5 text-amber-600 group-hover:text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 group-hover:text-white">Course Approvals</div>
                <div className="text-xs text-slate-500 group-hover:text-white/80">Approve or Reject Forms</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </Link>

          <Link
            href="/staff/students"
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-[var(--color-poly-primary)] hover:text-white border border-slate-200 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-slate-700 shadow-2xs group-hover:bg-white/20 group-hover:text-white transition-colors">
                <Users className="w-5 h-5 text-emerald-600 group-hover:text-white" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 group-hover:text-white">Enrolled Students</div>
                <div className="text-xs text-slate-500 group-hover:text-white/80">View Class Rosters</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
          </Link>
        </div>
      </div>

      {/* Main Section: My Teaching Allocation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-poly-primary)]" />
            My Teaching Allocation ({assignedCourses.length})
          </h2>
          <Link
            href="/staff/upload-results"
            className="text-xs font-bold text-[var(--color-poly-primary)] hover:underline flex items-center gap-1"
          >
            Upload Results
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {assignedCourses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No courses assigned yet</p>
            <p className="text-xs text-slate-500">
              The Head of Department (HOD) will assign courses to your teaching profile.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignedCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-100">
                      {course.code}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      {course.level} • {course.semester} Sem
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-3">
                    {course.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg mb-4">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Credit Units</span>
                      <span className="font-bold text-slate-800">{course.creditUnits} Units</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Enrolled</span>
                      <span className="font-bold text-slate-800">
                        {course._count.courseRegistrations} Students
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/staff/upload-results?courseId=${course.id}`}
                  className="w-full py-2 bg-slate-100 hover:bg-[var(--color-poly-primary)] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Enter Course Grades
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

