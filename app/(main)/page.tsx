import Link from 'next/link';
import { mockAnnouncements, mockStaff } from '@/lib/mock-data';
import { ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';

export default function LandingPage() {
  const latestAnnouncements = mockAnnouncements.slice(0, 3);
  
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="bg-[var(--color-poly-primary)] text-white py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/polyibadan/1920/1080')] bg-cover bg-center"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            Welcome to the <span className="text-[var(--color-poly-secondary)]">Computer Science</span> Department
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Fostering innovation, excellence in computing, and producing world-class software engineers and technologists at The Polytechnic, Ibadan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="bg-[var(--color-poly-secondary)] text-[var(--color-poly-primary)] font-bold py-3 px-8 rounded-md hover:bg-[var(--color-poly-secondary-dark)] transition-all flex items-center justify-center gap-2">
              Student Portal <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#programs" className="bg-transparent border border-gray-400 text-white font-semibold py-3 px-8 rounded-md hover:border-white hover:bg-white/5 transition-all">
              Explore Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-[var(--color-poly-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--color-poly-text-heading)] mb-4">Academic Programs</h2>
            <div className="w-20 h-1 bg-[var(--color-poly-secondary)] mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="bg-slate-50 w-14 h-14 rounded flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-[var(--color-poly-primary)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-poly-text-heading)] mb-3">National Diploma (ND)</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                A 2-year foundational program designed to equip students with core computing skills, programming fundamentals, and IT infrastructure management.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-poly-secondary)]"></span> Introduction to Computing</li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-poly-secondary)]"></span> Systems Analysis & Design</li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-poly-secondary)]"></span> Programming (C++, Java, Web)</li>
              </ul>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="bg-slate-50 w-14 h-14 rounded flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-[var(--color-poly-secondary-dark)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-poly-text-heading)] mb-3">Higher National Diploma (HND)</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                An advanced 2-year program focusing on specialization in software engineering, artificial intelligence, database administration, and advanced networking.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-poly-secondary)]"></span> Advanced Database Systems</li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-poly-secondary)]"></span> Artificial Intelligence</li>
                <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-poly-secondary)]"></span> Software Engineering</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* News and Announcements */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-[var(--color-poly-text-heading)] mb-4">Latest Announcements</h2>
              <div className="w-20 h-1 bg-[var(--color-poly-secondary)]"></div>
            </div>
            <Link href="/login" className="text-[var(--color-poly-primary)] font-semibold hover:underline mt-4 md:mt-0">
              View all updates &rarr;
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestAnnouncements.map((ann) => (
              <div key={ann.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {new Date(ann.publishedAt).toLocaleDateString()}
                  </span>
                  {ann.isUrgent && (
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">URGENT</span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[var(--color-poly-text-heading)] mb-2">{ann.title}</h4>
                <p className="text-xs text-slate-500 mb-6 flex-grow">{ann.content}</p>
                <div className="mt-auto pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Target: {ann.targetAudience}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Directory Preview */}
      <section id="staff" className="py-20 bg-[var(--color-poly-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--color-poly-text-heading)] mb-4">Our Faculty</h2>
            <div className="w-20 h-1 bg-[var(--color-poly-secondary)] mx-auto mb-6"></div>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              Meet our team of dedicated professionals and academics committed to delivering quality education.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mockStaff.map((staff) => (
              <div key={staff.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 text-center p-6">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-200">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-[var(--color-poly-text-heading)]">
                  {staff.title} {staff.firstName} {staff.lastName}
                </h4>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-poly-secondary-dark)] font-bold mb-3">{staff.role === 'Admin' ? 'Head of Department' : 'Lecturer'}</p>
                <p className="text-xs text-slate-500 line-clamp-2">{staff.specialization}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
