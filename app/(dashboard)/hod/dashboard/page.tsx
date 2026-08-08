import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  GraduationCap, 
  BarChart3, 
  FileText, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  ArrowUpRight, 
  Award,
  UserCheck
} from 'lucide-react';

export default async function HODDashboardPage() {
  const session = await getSession();

  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    redirect('/login');
  }

  // Fetch HOD User Details
  const currentUser = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { staffProfile: true }
  });

  const academicSession = '2024/2025';

  // Fetch Key Counts
  const [
    totalStudents,
    totalStaff,
    totalCourses,
    pendingCourseRegsCount,
    studentLevelsGroup,
    pendingResultsCoursesGroup,
    approvedResultsCount,
    pendingResultsTotalCount
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.staffProfile.count(),
    prisma.course.count(),
    prisma.courseRegistration.count({
      where: { 
        status: { in: ['Pending', 'PENDING', 'pending'] }, 
        academicSession 
      }
    }),
    prisma.studentProfile.groupBy({
      by: ['level'],
      _count: { _all: true }
    }),
    prisma.result.groupBy({
      by: ['courseId'],
      where: { isApproved: false, academicSession },
      _count: { _all: true }
    }),
    prisma.result.count({
      where: { isApproved: true, academicSession }
    }),
    prisma.result.count({
      where: { isApproved: false, academicSession }
    })
  ]);

  const pendingResultCoursesCount = pendingResultsCoursesGroup.length;

  // Fetch Courses with pending results for Action Needed section
  const pendingCourseIds = pendingResultsCoursesGroup.map(g => g.courseId);
  const pendingCoursesWithDetails = pendingCourseIds.length > 0
    ? await prisma.course.findMany({
        where: { id: { in: pendingCourseIds } },
        include: {
          lecturer: {
            include: { user: true }
          },
          results: {
            where: { academicSession, isApproved: false }
          }
        },
        take: 4
      })
    : [];

  // Fetch recent pending course registrations for Action Needed
  const recentPendingRegistrations = await prisma.courseRegistration.findMany({
    where: { 
      status: { in: ['Pending', 'PENDING', 'pending'] }, 
      academicSession 
    },
    include: {
      student: {
        include: { user: true }
      },
      course: true
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  // Calculate Student Level Breakdown
  const levelCounts: Record<string, number> = {
    ND1: 0,
    ND2: 0,
    HND1: 0,
    HND2: 0
  };
  studentLevelsGroup.forEach(g => {
    if (g.level in levelCounts) {
      levelCounts[g.level] = g._count._all;
    }
  });

  // Calculate Total Department Results Performance
  const totalResultsCount = approvedResultsCount + pendingResultsTotalCount;
  const totalApprovedPercentage = totalResultsCount > 0 
    ? Math.round((approvedResultsCount / totalResultsCount) * 100) 
    : 0;

  const hodName = currentUser 
    ? `${currentUser.firstName} ${currentUser.lastName}` 
    : 'Head of Department';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[var(--color-poly-primary)] via-emerald-900 to-[var(--color-poly-primary-light)] text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-amber-200 uppercase border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Academic Session {academicSession} • Departmental Executive Portal
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {hodName}
          </h1>

          <p className="text-sm text-slate-100/90 max-w-2xl leading-relaxed">
            Head of Department Dashboard • Computer Science Department, The Polytechnic, Ibadan. Overview of departmental academics, student enrollments, lecturer grade submissions, and pending approvals.
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Enrolled Students
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalStudents}</div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            <span>ND: {levelCounts.ND1 + levelCounts.ND2}</span>
            <span>HND: {levelCounts.HND1 + levelCounts.HND2}</span>
          </div>
        </div>

        {/* Academic Staff */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Academic Staff
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalStaff}</div>
          <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Across {totalCourses} departmental courses
          </p>
        </div>

        {/* Pending Course Registrations */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Registrations
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{pendingCourseRegsCount}</div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Awaiting sign-off</span>
            <Link 
              href="/hod/course-approvals" 
              className="text-[var(--color-poly-primary)] font-bold hover:underline inline-flex items-center gap-0.5"
            >
              Review <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pending Result Approvals */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Results
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-600">{pendingResultCoursesCount}</div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{pendingResultsTotalCount} candidate marks</span>
            <Link 
              href="/hod/approve-results" 
              className="text-purple-700 font-bold hover:underline inline-flex items-center gap-0.5"
            >
              Approve <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Action Required Section */}
      {(pendingCourseRegsCount > 0 || pendingResultCoursesCount > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500 text-white rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-amber-950">
                  Items Requiring HOD Endorsement
                </h2>
                <p className="text-xs text-amber-800">
                  Submitted course results and student registrations waiting for official department clearance.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/hod/approve-results"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                Approve Results ({pendingResultCoursesCount})
              </Link>
              <Link
                href="/hod/course-approvals"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                Approve Courses ({pendingCourseRegsCount})
              </Link>
            </div>
          </div>

          {/* Pending Course Results Preview */}
          {pendingCoursesWithDetails.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Course Grading Sheets Submitted by Lecturers:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {pendingCoursesWithDetails.map(course => (
                  <div key={course.id} className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-100">
                        {course.code}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {course.results.length} Candidates
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{course.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        Lecturer: {course.lecturer?.user.firstName} {course.lecturer?.user.lastName}
                      </p>
                    </div>

                    <Link
                      href={`/hod/approve-results`}
                      className="block text-center py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-colors"
                    >
                      Audit & Approve
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Department Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col (2 span): Level Distribution & Recent Registrations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Level Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--color-poly-primary)]" />
                  Student Enrollment by Academic Level
                </h3>
                <p className="text-xs text-slate-500">National Diploma (ND) and Higher National Diploma (HND) breakdown</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                {totalStudents} Total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { level: 'ND1', label: 'ND I Level', count: levelCounts.ND1, color: 'bg-blue-500' },
                { level: 'ND2', label: 'ND II Level', count: levelCounts.ND2, color: 'bg-indigo-500' },
                { level: 'HND1', label: 'HND I Level', count: levelCounts.HND1, color: 'bg-emerald-500' },
                { level: 'HND2', label: 'HND II Level', count: levelCounts.HND2, color: 'bg-amber-500' }
              ].map(item => {
                const percentage = totalStudents > 0 ? Math.round((item.count / totalStudents) * 100) : 0;
                return (
                  <div key={item.level} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700">{item.level}</span>
                      <span className="text-[10px] font-bold text-slate-400">{percentage}%</span>
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900">{item.count}</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Registrations Activity */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[var(--color-poly-primary)]" />
                  Recent Course Registration Requests
                </h3>
                <p className="text-xs text-slate-500">Students awaiting HOD course registration verification</p>
              </div>

              <Link
                href="/hod/course-approvals"
                className="text-xs font-bold text-[var(--color-poly-primary)] hover:underline inline-flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentPendingRegistrations.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No pending course registration approvals at this time. All caught up!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPendingRegistrations.map(reg => (
                  <div key={reg.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--color-poly-primary)]">
                          {reg.student.matricNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {reg.student.user.firstName} {reg.student.user.lastName}
                        </span>
                        <span className="text-[10px] bg-slate-100 font-mono text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          {reg.student.level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Course: <strong className="text-slate-800">{reg.course.code} — {reg.course.title}</strong>
                      </p>
                    </div>

                    <Link
                      href="/hod/course-approvals"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors self-start sm:self-auto border border-slate-200"
                    >
                      Review Registration
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Grading Performance & Quick Actions */}
        <div className="space-y-6">
          {/* Department Results Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-[var(--color-poly-primary)]" />
              Session Results Summary
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Approved Results</span>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {approvedResultsCount} Records
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Pending HOD Sign-off</span>
                <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                  {pendingResultsTotalCount} Records
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Approval Progress</span>
                  <span>{totalApprovedPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full transition-all" style={{ width: `${totalApprovedPercentage}%` }} />
                </div>
              </div>

              <Link
                href="/hod/approve-results"
                className="w-full mt-2 py-2.5 bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <CheckCircle className="w-4 h-4" />
                Go to Results Approval Center
              </Link>
            </div>
          </div>

          {/* Executive Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              HOD Quick Navigation
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <Link 
                href="/hod/approve-results" 
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">Approve Course Results</span>
                </div>
                {pendingResultCoursesCount > 0 && (
                  <span className="bg-purple-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {pendingResultCoursesCount} New
                  </span>
                )}
              </Link>

              <Link 
                href="/hod/course-approvals" 
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg group-hover:bg-amber-200 transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">Course Registration Approvals</span>
                </div>
                {pendingCourseRegsCount > 0 && (
                  <span className="bg-amber-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                    {pendingCourseRegsCount} Pending
                  </span>
                )}
              </Link>

              <Link 
                href="/hod/manage-staff" 
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-800 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">Manage Academic Staff</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </Link>

              <Link 
                href="/hod/manage-students" 
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">Manage Department Students</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </Link>

              <Link 
                href="/hod/manage-courses" 
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-800 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs text-slate-800">Manage Curriculum & Courses</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
