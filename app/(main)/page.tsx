import Link from 'next/link';
import Image from 'next/image';
import { getAnnouncements } from '@/app/(dashboard)/hod/announcements/actions';
import { prisma } from '@/lib/prisma';
import { ArrowRight, BookOpen, GraduationCap, Users, Megaphone, Calendar, AlertTriangle } from 'lucide-react';

export const revalidate = 0; // Dynamic data for landing page announcements

export default async function LandingPage() {
  const { announcements = [] } = await getAnnouncements();
  const latestAnnouncements = (announcements || []).slice(0, 6);

  // Fetch staff for Faculty section
  let staffList = await prisma.user.findMany({
    where: {
      role: { in: ['Admin', 'Staff'] }
    },
    include: {
      staffProfile: true
    },
    take: 8
  });

  return (
    <div className="flex flex-col w-full font-sans">
      {/* Urgent Announcement Ticker / Banner if urgent exists */}
      {latestAnnouncements.some(a => a.isUrgent) && (
        <div className="bg-red-600 text-white px-4 py-2.5 text-xs font-bold shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="bg-white text-red-700 px-2 py-0.5 rounded text-[10px] uppercase font-black shrink-0">
                Urgent Notice
              </span>
              <p className="truncate text-red-50">
                {latestAnnouncements.find(a => a.isUrgent)?.title}: {latestAnnouncements.find(a => a.isUrgent)?.content}
              </p>
            </div>
            <Link href="#announcements" className="underline shrink-0 hover:text-red-200 transition-colors">
              Read Details
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-[var(--color-poly-primary)] text-white py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/polyibadan/1920/1080')] bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 relative bg-white p-2 rounded-2xl shadow-xl border-2 border-amber-300/40 mb-6 overflow-hidden transform hover:scale-105 transition-transform">
            <Image 
              src="/logo.jpeg" 
              alt="The Polytechnic, Ibadan Official Emblem" 
              fill 
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-[var(--color-poly-secondary)] mb-6 border border-white/15">
            <Megaphone className="w-3.5 h-3.5" />
            <span>Official Portal &bull; Department of Computer Science</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Welcome to the <span className="text-[var(--color-poly-secondary)]">Computer Science</span> Department
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Fostering innovation, academic excellence, and producing world-class software engineers and technologists at The Polytechnic, Ibadan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="bg-[var(--color-poly-secondary)] text-[var(--color-poly-primary)] font-extrabold py-3.5 px-8 rounded-xl hover:bg-[var(--color-poly-secondary-dark)] transition-all flex items-center justify-center gap-2 shadow-md">
              Portal Sign In <ArrowRight className="w-5 h-5 text-[var(--color-poly-primary)]" />
            </Link>
            <Link href="#programs" className="bg-white/10 border border-white/20 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-white/20 transition-all">
              Academic Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic News and Announcements Section */}
      <section id="announcements" className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2 text-[var(--color-poly-primary)] font-bold text-xs uppercase tracking-wider mb-2">
                <Megaphone className="w-4 h-4 text-[var(--color-poly-secondary)]" />
                <span>Real-Time Broadcasts</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">
                Departmental Announcements
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Stay informed with official directives, exam notices, and academic bulletins
              </p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-poly-primary)] hover:underline">
              <span>View Student Portal Updates</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestAnnouncements.length > 0 ? (
              latestAnnouncements.map((ann) => {
                const formattedDate = ann.publishedAt 
                  ? new Date(ann.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recent';

                return (
                  <div 
                    key={ann.id} 
                    className={`bg-white border rounded-2xl p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden ${
                      ann.isUrgent ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200/90'
                    }`}
                  >
                    {ann.isUrgent && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                          ann.isUrgent ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {ann.targetAudience || 'All Students'}
                        </span>
                        
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formattedDate}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 mb-2 leading-snug">
                        {ann.title}
                      </h3>
                      
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 mb-6">
                        {ann.content}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium mt-auto">
                      <span>
                        By: <strong className="text-slate-700">{ann.author?.title || ''} {ann.author?.user?.lastName || 'Department Office'}</strong>
                      </span>
                      {ann.isUrgent && (
                        <span className="text-red-600 font-bold text-[10px] uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Urgent
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <Megaphone className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No active announcements at the moment</p>
                <p className="text-xs text-slate-500">Check back later for departmental updates and academic schedules.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-[var(--color-poly-bg)] border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Academic Programs</h2>
            <div className="w-16 h-1 bg-[var(--color-poly-secondary)] mx-auto rounded-full"></div>
            <p className="text-xs sm:text-sm text-slate-500 mt-3 max-w-xl mx-auto">
              Comprehensive diploma courses accredited by NBTE for technical excellence
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-2xs border border-slate-200/90 hover:shadow-md transition-shadow">
              <div className="bg-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-[var(--color-poly-primary)]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">National Diploma (ND)</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                A 2-year foundational program designed to equip students with core computing skills, programming fundamentals, logic, and IT infrastructure management.
              </p>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-poly-secondary)]"></span> Introduction to Computing & Operating Systems
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-poly-secondary)]"></span> Systems Analysis & Database Design
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-poly-secondary)]"></span> Programming (C++, Java, Web Development)
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-2xs border border-slate-200/90 hover:shadow-md transition-shadow">
              <div className="bg-amber-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-amber-700" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Higher National Diploma (HND)</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                An advanced 2-year program focusing on specialization in software engineering, artificial intelligence, database administration, and advanced networking.
              </p>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-poly-secondary)]"></span> Advanced Database Systems & Architecture
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-poly-secondary)]"></span> Artificial Intelligence & Machine Learning
                </li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-poly-secondary)]"></span> Software Engineering & Cloud Infrastructure
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Staff Directory Preview */}
      <section id="staff" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Our Academic Faculty</h2>
            <div className="w-16 h-1 bg-[var(--color-poly-secondary)] mx-auto rounded-full mb-4"></div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-medium">
              Meet our team of dedicated professionals and academics committed to delivering quality education.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {staffList.map((staff) => {
              const formattedTitle = staff.staffProfile?.title || 'Dr.';
              const fullName = `${formattedTitle} ${staff.firstName} ${staff.lastName}`.trim();

              return (
                <div key={staff.id} className="bg-white rounded-2xl border border-slate-200/90 text-center p-6 shadow-2xs hover:shadow-md transition-all flex flex-col items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl mx-auto mb-4 flex items-center justify-center font-black text-lg shadow-2xs">
                    <Users className="w-7 h-7 text-[var(--color-poly-secondary)]" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 mb-1">
                    {fullName}
                  </h4>
                  <p className="text-[10px] uppercase tracking-wider text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 mb-3">
                    {staff.role === 'Admin' ? 'Head of Department' : 'Lecturer'}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {staff.staffProfile?.specialization || 'Computer Science & Software Development'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
