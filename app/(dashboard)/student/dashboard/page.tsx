import { Calendar, FileText, GraduationCap, Bell } from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function StudentDashboard() {
  const session = await getSession();
  
  if (!session || session.role !== 'Student') {
    redirect('/login');
  }

  const student = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { 
      studentProfile: {
        include: {
          results: true,
        }
      } 
    }
  });

  if (!student || !student.studentProfile) {
    redirect('/login');
  }

  const { level, academicSession } = student.studentProfile;
  const currentSemester = 'First';

  // Get course registrations for current session and semester
  const registrations = await prisma.courseRegistration.findMany({
    where: {
      studentId: student.studentProfile.id,
      academicSession,
      semester: currentSemester as any
    },
    include: {
      course: true
    }
  });

  let regStatus = 'Pending';
  let regStatusColor = 'text-amber-600';
  let totalCredits = 0;
  
  if (registrations.length === 0) {
    regStatus = 'Not Started';
    regStatusColor = 'text-slate-400';
  } else {
    totalCredits = registrations.reduce((sum, reg) => sum + reg.course.creditUnits, 0);
    const statuses = registrations.map(reg => reg.status);
    if (statuses.includes('Pending')) {
      regStatus = 'Pending Approval';
      regStatusColor = 'text-amber-600';
    } else if (statuses.includes('Rejected')) {
      regStatus = 'Needs Attention';
      regStatusColor = 'text-red-600';
    } else {
      regStatus = 'Approved';
      regStatusColor = 'text-green-600';
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Level</p>
          <h3 className="text-2xl font-bold text-[var(--color-poly-text-heading)]">{level}</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">{currentSemester} Semester</p>
        </div>
        
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reg. Status</p>
          <h3 className={`text-2xl font-bold ${regStatusColor}`}>{regStatus}</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            {regStatus === 'Not Started' ? 'Awaiting Submission' : 'Semester Registration'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Latest CGPA</p>
          <h3 className="text-2xl font-bold text-green-600">--</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">No previous records</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Credits</p>
          <h3 className="text-2xl font-bold text-[var(--color-poly-text-heading)]">{totalCredits}</h3>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            {regStatus === 'Approved' ? 'Approved Units' : 'Registered Units'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[460px]">
        {/* Quick Actions (Main Content Panel) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-[var(--color-poly-text-heading)]">Quick Actions</h2>
          </div>
          <div className="p-6 flex-1 overflow-hidden space-y-4">
            <Link href="/student/course-registration" className="flex items-center px-6 py-4 text-[var(--color-poly-text-heading)] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors group">
              <FileText className="w-5 h-5 mr-4 text-slate-400 group-hover:text-[var(--color-poly-primary)]" />
              <div className="flex-1">
                <h4 className="text-sm font-bold group-hover:text-[var(--color-poly-primary)]">Course Registration</h4>
                <p className="text-[10px] text-slate-500 mt-1">Register for current semester courses or print approved forms</p>
              </div>
              <span className="text-slate-300 group-hover:text-[var(--color-poly-primary)]">&rarr;</span>
            </Link>

            <Link href="/student/results" className="flex items-center px-6 py-4 text-[var(--color-poly-text-heading)] hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors group">
              <Calendar className="w-5 h-5 mr-4 text-slate-400 group-hover:text-[var(--color-poly-primary)]" />
              <div className="flex-1">
                <h4 className="text-sm font-bold group-hover:text-[var(--color-poly-primary)]">Check Results</h4>
                <p className="text-[10px] text-slate-500 mt-1">View and print approved semester results</p>
              </div>
              <span className="text-slate-300 group-hover:text-[var(--color-poly-primary)]">&rarr;</span>
            </Link>
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <p className="text-center text-[10px] text-slate-400 font-medium uppercase">Last login: Today</p>
          </div>
        </div>

        {/* Notifications Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-full">
            <h2 className="text-sm font-bold text-[var(--color-poly-text-heading)] mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--color-poly-secondary)]" /> Departmental Bulletins
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-[#F8FAFC] border-l-4 border-[var(--color-poly-primary)] rounded-r">
                <p className="text-[11px] font-bold text-[var(--color-poly-primary)]">Submission of Course Registration Forms</p>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">All students are expected to submit their printed and signed course registration forms after approval.</p>
                <span className="text-[9px] text-[var(--color-poly-secondary-dark)] mt-2 block font-bold">URGENT</span>
              </div>
            </div>
            
            <div className="mt-6">
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className={`h-full ${regStatus === 'Approved' ? 'bg-green-500' : 'bg-[var(--color-poly-secondary)]'}`} style={{ width: regStatus === 'Approved' ? '100%' : (regStatus === 'Not Started' ? '0%' : '50%') }}></div>
               </div>
               <div className="flex justify-between mt-2 text-[10px] font-medium">
                 <span>Registration Progress</span>
                 <span className={`font-bold ${regStatus === 'Approved' ? 'text-green-600' : 'text-[var(--color-poly-primary)]'}`}>
                   {regStatus === 'Approved' ? '100%' : (regStatus === 'Not Started' ? '0%' : '50%')}
                 </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
