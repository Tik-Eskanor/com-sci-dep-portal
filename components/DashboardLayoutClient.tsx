'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, Calendar, ChevronLeft, FileText, Home, LogOut, Settings, 
  User, Users, BarChart3, CheckCircle, GraduationCap, Menu, X, Megaphone,
  HelpCircle, Mail, MapPin
} from 'lucide-react';
import { LogoutButton } from './LogoutButton';

export default function DashboardLayoutClient({
  children,
  userRole,
  userName,
  userFirstName,
  userLastName,
  userImage,
  userIdString,
}: {
  children: React.ReactNode,
  userRole: string,
  userName: string,
  userFirstName?: string,
  userLastName?: string,
  userImage?: string | null,
  userIdString: string,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path 
      ? "bg-[var(--color-poly-primary-light)] border-l-4 border-[var(--color-poly-secondary)] text-white" 
      : "text-slate-400 hover:text-white border-l-4 border-transparent";
  };

  return (
    <div className="flex h-screen bg-[var(--color-poly-bg)] overflow-hidden font-sans text-[var(--color-poly-text-body)]">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[var(--color-poly-primary)] flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 print:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-[var(--color-poly-primary-light)] flex justify-between items-center">
          <Link href="/student/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 relative bg-white p-1 rounded-xl shadow-xs overflow-hidden shrink-0 border border-amber-200/50 group-hover:scale-105 transition-transform">
              <Image 
                src="/logo.jpeg" 
                alt="The Polytechnic, Ibadan Logo" 
                fill 
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-xs uppercase tracking-wider group-hover:text-[var(--color-poly-secondary)] transition-colors">Computer Science</h1>
              <p className="text-[var(--color-poly-secondary)] text-[10px] font-semibold">The Polytechnic, Ibadan</p>
            </div>
          </Link>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto">
          {userRole === 'Student' && (
            <>
              <div className="px-6 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Student Area</div>
              <Link href="/student/dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/student/dashboard')}`}>
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link href="/student/course-registration" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/student/course-registration')}`}>
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Course Registration</span>
              </Link>
              <Link href="/student/results" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/student/results')}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Check Results</span>
              </Link>
              <Link href="/student/profile" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/student/profile')}`}>
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Profile Settings</span>
              </Link>
            </>
          )}

          {userRole === 'Staff' && (
            <>
              <div className="px-6 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Staff Area</div>
              <Link href="/staff/dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/staff/dashboard')}`}>
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link href="/staff/upload-results" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/staff/upload-results')}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Upload Results</span>
              </Link>
              <Link href="/staff/students" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/staff/students')}`}>
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">My Students</span>
              </Link>
              <Link href="/staff/course-approvals" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/staff/course-approvals')}`}>
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Course Approvals</span>
              </Link>
            </>
          )}

          {userRole === 'Admin' && (
            <>
              <div className="px-6 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">HOD Area</div>
              <Link href="/hod/dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/hod/dashboard')}`}>
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              <Link href="/hod/approve-results" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/hod/approve-results')}`}>
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Approve Results</span>
              </Link>
              <Link href="/hod/course-approvals" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/hod/course-approvals')}`}>
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Course Approvals</span>
              </Link>
              <Link href="/hod/manage-staff" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/hod/manage-staff')}`}>
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Manage Staff</span>
              </Link>
              <Link href="/hod/manage-students" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/hod/manage-students')}`}>
                <GraduationCap className="w-5 h-5" />
                <span className="text-sm font-medium">Manage Students</span>
              </Link>
              <Link href="/hod/manage-courses" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/hod/manage-courses')}`}>
                <BookOpen className="w-5 h-5" />
                <span className="text-sm font-medium">Manage Courses</span>
              </Link>
              <Link href="/hod/announcements" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/hod/announcements')}`}>
                <Megaphone className="w-5 h-5" />
                <span className="text-sm font-medium">Announcements</span>
              </Link>
              <Link href="/hod/statistics" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive('/hod/statistics')}`}>
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Statistics</span>
              </Link>
            </>
          )}
        </nav>
        
        <div className="p-6 bg-[var(--color-poly-primary-light)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-600 border-2 border-[var(--color-poly-secondary)] flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {userImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={userImage} alt={userLastName || userName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              {userLastName ? (
                <p className="text-white text-xs font-bold truncate">
                  <span className="text-[var(--color-poly-secondary)] font-extrabold uppercase">{userLastName}</span> {userFirstName}
                </p>
              ) : (
                <p className="text-white text-xs font-bold truncate">{userName}</p>
              )}
              <p className="text-slate-300 text-[10px] truncate font-medium">{userIdString} &bull; {userRole === 'Admin' ? 'HOD' : userRole}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 print:hidden">
          <div className="flex items-center md:hidden gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="text-[var(--color-poly-primary)] p-1">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-[var(--color-poly-primary)]">CS PORTAL</span>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <span className="text-slate-400 text-sm">Academic Session: <strong className="text-[var(--color-poly-text-heading)]">2024/2025</strong></span>
            <span className="w-px h-4 bg-slate-200"></span>
            <span className="text-slate-400 text-sm">Semester: <strong className="text-[var(--color-poly-text-heading)]">First</strong></span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 ml-auto">
             <button 
               onClick={() => setHelpModalOpen(true)}
               className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-1.5 bg-[var(--color-poly-secondary)] hover:bg-[var(--color-poly-secondary-dark)] text-[var(--color-poly-primary)] rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
             >
               <HelpCircle className="w-3.5 h-3.5" />
               <span>Help</span>
             </button>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8 print:p-0">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>

      {/* Help & Support Desk Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[var(--color-poly-primary)] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--color-poly-secondary)] text-[var(--color-poly-primary)] rounded-xl shadow-xs">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg leading-tight">Portal Support & Help Desk</h3>
                  <p className="text-xs text-slate-300">Department of Computer Science &bull; The Polytechnic, Ibadan</p>
                </div>
              </div>
              <button 
                onClick={() => setHelpModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Contact Directives */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Official Support Channels</h4>
                
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[var(--color-poly-primary)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Departmental ICT Support</p>
                    <p className="text-xs text-slate-600">Report portal glitches, course registration or result query issues:</p>
                    <a href="mailto:cs.support@polyibadan.edu.ng" className="text-xs font-bold text-[var(--color-poly-primary)] underline">
                      cs.support@polyibadan.edu.ng
                    </a>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[var(--color-poly-primary)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">Physical Office Enquiries</p>
                    <p className="text-xs text-slate-600">Computer Science HOD Administrative Block, Main Campus</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Working Hours: Mon &ndash; Fri &bull; 9:00 AM &ndash; 4:00 PM</p>
                  </div>
                </div>
              </div>

              {/* FAQs */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Frequently Asked Questions</h4>
                
                <details className="group bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs font-medium cursor-pointer">
                  <summary className="font-bold text-slate-800 list-none flex justify-between items-center">
                    <span>How do I complete my course registration?</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">&darr;</span>
                  </summary>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    Select your registered courses in the &quot;Course Registration&quot; section, click Save &amp; Submit, and generate your printable course slip for departmental advisor endorsement.
                  </p>
                </details>

                <details className="group bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs font-medium cursor-pointer">
                  <summary className="font-bold text-slate-800 list-none flex justify-between items-center">
                    <span>When are semester results uploaded?</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">&darr;</span>
                  </summary>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    Lecturers upload scores directly via their staff portals. Once verified and approved by the HOD, scores reflect instantly on your student dashboard.
                  </p>
                </details>

                <details className="group bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs font-medium cursor-pointer">
                  <summary className="font-bold text-slate-800 list-none flex justify-between items-center">
                    <span>How do I update my profile details?</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">&darr;</span>
                  </summary>
                  <p className="mt-2 text-slate-600 leading-relaxed">
                    Head to &quot;Profile Settings&quot; in your sidebar menu to update your phone number, avatar photo, and contact address.
                  </p>
                </details>
              </div>

              {/* Close CTA */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(false)}
                  className="w-full bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white py-2.5 rounded-xl font-bold text-xs transition-colors shadow-xs"
                >
                  Close Help Desk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
