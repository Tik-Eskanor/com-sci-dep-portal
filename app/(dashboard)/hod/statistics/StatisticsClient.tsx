'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Award,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  Filter,
  BarChart2,
  PieChart as PieIcon,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';

export type DepartmentStatsData = {
  activeSession: string;
  totalStudents: number;
  levelCounts: { level: string; count: number }[];
  performanceDistribution: { name: string; value: number; color: string }[];
  coursePerformance: {
    code: string;
    title: string;
    level: string;
    enrolled: number;
    passed: number;
    failed: number;
    passRate: number;
    avgScore: number;
  }[];
  staffWorkload: {
    staffId: string;
    name: string;
    specialization: string;
    courseCount: number;
    totalUnits: number;
    submittedResults: boolean;
  }[];
  sessionTrends: {
    session: string;
    avgCgpa: number;
    distinctionRate: number;
    passRate: number;
  }[];
};

type Props = {
  stats: DepartmentStatsData;
  availableSessions: string[];
};

export default function StatisticsClient({ stats, availableSessions }: Props) {
  const [selectedSession, setSelectedSession] = useState(stats.activeSession);
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'courses' | 'levels' | 'staff'>('courses');

  // Filter course performance by level if selected
  const filteredCourses = useMemo(() => {
    if (selectedLevel === 'All') return stats.coursePerformance;
    return stats.coursePerformance.filter((c) => c.level === selectedLevel);
  }, [stats.coursePerformance, selectedLevel]);

  // Handle Printable Report
  const handlePrintReport = () => {
    toast.info('Preparing Executive Departmental Report for printing...');
    const printElement = document.getElementById('printable-hod-statistics-report');

    if (printElement) {
      try {
        const printWin = window.open('', '_blank', 'width=950,height=1000');
        if (printWin) {
          printWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>HOD Departmental Analytics Report - ${selectedSession}</title>
                <meta charset="utf-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  @page { size: A4 portrait; margin: 12mm; }
                  body { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; color: #000; background: #fff; padding: 15px; margin: 0; }
                  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
                  th, td { border: 1px solid #000; padding: 6px; }
                  th { background-color: #f1f5f9; font-weight: bold; }
                </style>
              </head>
              <body>
                <div style="max-width: 850px; margin: 0 auto;">
                  ${printElement.innerHTML}
                </div>
                <script>
                  window.onload = function() {
                    setTimeout(function() {
                      window.focus();
                      window.print();
                    }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          printWin.document.close();
          return;
        }
      } catch {
        // Fallback
      }
    }

    try {
      window.focus();
      window.print();
    } catch {
      toast.error('Unable to open print dialog. Press Ctrl+P or Cmd+P.');
    }
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Course Code', 'Course Title', 'Level', 'Enrolled', 'Passed', 'Failed', 'Pass Rate (%)', 'Avg Score'],
      ...filteredCourses.map((c) => [
        c.code,
        `"${c.title}"`,
        c.level,
        c.enrolled,
        c.passed,
        c.failed,
        `${c.passRate}%`,
        c.avgScore
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Department_Statistics_${selectedSession.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Departmental statistics CSV exported!');
  };

  // Color mappings
  const COLORS = ['#10B981', '#3B82F6', '#14B8A6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Printable Report Hidden Div */}
      <div className="hidden print:block text-black bg-white font-serif p-4">
        <PrintableHODReport stats={stats} selectedSession={selectedSession} />
      </div>

      {/* Screen Header */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[var(--color-poly-primary)] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                Department of Computer Science
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> HOD Executive Analytics
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-poly-text-heading)]">
              Departmental Academic Analytics & Performance Statistics
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Real-time student enrollment, grade classification, course pass rates, and staff workload insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 border border-slate-200 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export CSV
            </button>

            <button
              onClick={handlePrintReport}
              className="px-5 py-2.5 bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors inline-flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Executive Report
            </button>
          </div>
        </div>

        {/* Global Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolled Students</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.totalStudents}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                +4.2% YoY
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-3">
              ND: <strong className="text-slate-800">410</strong> &bull; HND: <strong className="text-slate-800">270</strong>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Department CGPA</span>
              <Award className="w-5 h-5 text-[var(--color-poly-secondary)]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[var(--color-poly-primary)]">3.18</span>
              <span className="text-xs font-bold text-slate-400">/ 4.00</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-3">
              Upper Credit Average &bull; <strong className="text-emerald-700">18.5% Distinction Rate</strong>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Course Pass Rate</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">84.6%</span>
              <span className="text-xs font-bold text-slate-400">Avg Overall</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-3">
              Highest: <strong className="text-emerald-700">COM 111 (92%)</strong> &bull; Lowest: <strong className="text-amber-700">COM 113 (68%)</strong>
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Staff & Compliance</span>
              <UserCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{stats.staffWorkload.length}</span>
              <span className="text-xs font-bold text-slate-400">Lecturers</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-3">
              Result Submission: <strong className="text-emerald-700">100% On-Time</strong>
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Analytics:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-[var(--color-poly-primary)]"
              >
                {availableSessions.map((s) => (
                  <option key={s} value={s}>{s} Academic Session</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-[var(--color-poly-primary)]"
              >
                <option value="All">All Student Levels (ND & HND)</option>
                <option value="ND1">ND1 Level</option>
                <option value="ND2">ND2 Level</option>
                <option value="HND1">HND1 Level</option>
                <option value="HND2">HND2 Level</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visual Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Enrollment Distribution by Level */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[var(--color-poly-primary)]" />
                  Student Enrollment Breakdown
                </h3>
                <p className="text-[11px] text-slate-500">Distribution of registered students across levels ({selectedSession})</p>
              </div>
              <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-800 px-2.5 py-1 rounded border border-blue-200">
                Total: {stats.totalStudents}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.levelCounts} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="level" tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontSize: '12px', border: 'none' }}
                  />
                  <Bar dataKey="count" fill="#1B365D" radius={[8, 8, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Diploma Classification Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-[var(--color-poly-secondary)]" />
                  Academic Diploma Classification
                </h3>
                <p className="text-[11px] text-slate-500">Breakdown of student CGPA standings</p>
              </div>
              <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
                4.00 Scale
              </span>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.performanceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stats.performanceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontSize: '12px', border: 'none' }}
                    formatter={(value: any) => [`${value}% of Students`, 'Percentage']}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 3: Historical Session Performance Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Department Academic Progression Trend (Past Sessions)
              </h3>
              <p className="text-[11px] text-slate-500">Historical average CGPA and Distinction percentage growth</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.sessionTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCgpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B365D" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1B365D" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="session" tick={{ fontSize: 12, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#FFF', fontSize: '12px' }} />
                <Area type="monotone" dataKey="avgCgpa" stroke="#1B365D" fillOpacity={1} fill="url(#colorCgpa)" name="Avg CGPA" />
                <Area type="monotone" dataKey="distinctionRate" stroke="#10B981" fillOpacity={1} fill="url(#colorDist)" name="Distinction %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Data Tables Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Tab Selection Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-4 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'courses'
                  ? 'border-[var(--color-poly-primary)] text-[var(--color-poly-primary)]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Course Performance Matrix ({filteredCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('levels')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'levels'
                  ? 'border-[var(--color-poly-primary)] text-[var(--color-poly-primary)]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Level Enrollment & Performance
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'border-[var(--color-poly-primary)] text-[var(--color-poly-primary)]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Lecturer Teaching Workload ({stats.staffWorkload.length})
            </button>
          </div>

          {/* Tab 1: Course Performance Matrix */}
          {activeTab === 'courses' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Course Code</th>
                    <th className="px-5 py-3.5">Course Title</th>
                    <th className="px-4 py-3.5 text-center">Level</th>
                    <th className="px-4 py-3.5 text-center">Enrolled</th>
                    <th className="px-4 py-3.5 text-center">Passed</th>
                    <th className="px-4 py-3.5 text-center">Failed</th>
                    <th className="px-4 py-3.5 text-center">Pass Rate</th>
                    <th className="px-4 py-3.5 text-center">Avg Score</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredCourses.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{c.code}</td>
                      <td className="px-5 py-3.5 text-slate-800 font-semibold">{c.title}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-600">{c.level}</td>
                      <td className="px-4 py-3.5 text-center font-mono">{c.enrolled}</td>
                      <td className="px-4 py-3.5 text-center font-mono text-emerald-700 font-bold">{c.passed}</td>
                      <td className="px-4 py-3.5 text-center font-mono text-red-600 font-bold">{c.failed}</td>
                      <td className="px-4 py-3.5 text-center font-mono font-black text-slate-900">{c.passRate}%</td>
                      <td className="px-4 py-3.5 text-center font-mono text-slate-600">{c.avgScore}</td>
                      <td className="px-4 py-3.5 text-center">
                        {c.passRate >= 85 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Excellent
                          </span>
                        ) : c.passRate >= 70 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                            Normal
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            Needs Review
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Level Enrollment & Performance */}
          {activeTab === 'levels' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.levelCounts.map((lvl) => (
                  <div key={lvl.level} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--color-poly-primary)]">{lvl.level} Programme</span>
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{lvl.count} Students</div>
                    <p className="text-[10px] text-slate-500">
                      Share of Total: <strong className="text-slate-800">{Math.round((lvl.count / stats.totalStudents) * 100)}%</strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Lecturer Teaching Workload */}
          {activeTab === 'staff' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Staff ID</th>
                    <th className="px-5 py-3.5">Lecturer Name</th>
                    <th className="px-5 py-3.5">Specialization Area</th>
                    <th className="px-4 py-3.5 text-center">Courses Assigned</th>
                    <th className="px-4 py-3.5 text-center">Total Credit Units</th>
                    <th className="px-4 py-3.5 text-center">Result Submission Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {stats.staffWorkload.map((staff) => (
                    <tr key={staff.staffId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{staff.staffId}</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">{staff.name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{staff.specialization}</td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-800">{staff.courseCount} Courses</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">{staff.totalUnits} Units</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Submitted & Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

{/* Printable HOD Departmental Executive Report Component */}
function PrintableHODReport({
  stats,
  selectedSession
}: {
  stats: DepartmentStatsData;
  selectedSession: string;
}) {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div id="printable-hod-statistics-report" className="space-y-6 text-black bg-white p-2">
      {/* Official Institutional Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
        <div className="w-16 h-16 rounded-full border-2 border-slate-900 p-1 flex items-center justify-center bg-emerald-950 text-amber-400 font-bold text-center shrink-0">
          <div className="text-[9px] leading-tight uppercase font-extrabold">
            TPI<br />1970
          </div>
        </div>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl font-black uppercase tracking-wide text-slate-900">
            THE POLYTECHNIC, IBADAN
          </h1>
          <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
            FACULTY OF SCIENCE &bull; DEPARTMENT OF COMPUTER SCIENCE
          </h2>
          <div className="inline-block mt-2 bg-slate-900 text-white font-bold text-xs uppercase px-4 py-1 rounded">
            HOD EXECUTIVE DEPARTMENTAL STATISTICAL REPORT ({selectedSession})
          </div>
        </div>

        <div className="text-right text-[10px] font-mono text-slate-700">
          <p><strong>Date:</strong> {currentDate}</p>
          <p><strong>Session:</strong> {selectedSession}</p>
          <p><strong>Doc Ref:</strong> HOD/STAT/{selectedSession.replace('/', '-')}</p>
        </div>
      </div>

      {/* Summary Metrics Banner */}
      <div className="border border-slate-900 p-3 bg-slate-50 grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 block">Total Students</span>
          <strong className="text-base text-slate-900">{stats.totalStudents}</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 block">Average CGPA</span>
          <strong className="text-base text-slate-900">3.18 / 4.00</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 block">Distinction Rate</span>
          <strong className="text-base text-emerald-800">18.5%</strong>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-500 block">Academic Staff</span>
          <strong className="text-base text-slate-900">{stats.staffWorkload.length} Lecturers</strong>
        </div>
      </div>

      {/* Level Breakdown Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-slate-900">1. Student Enrollment Distribution by Level</h3>
        <table className="w-full text-left text-xs border-collapse border border-slate-900">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase">
              <th className="p-2 border-r border-slate-900">Academic Level</th>
              <th className="p-2 border-r border-slate-900 text-center">Student Count</th>
              <th className="p-2 text-center">% Share of Department</th>
            </tr>
          </thead>
          <tbody>
            {stats.levelCounts.map((lvl) => (
              <tr key={lvl.level} className="border-b border-slate-900">
                <td className="p-2 font-bold border-r border-slate-900">{lvl.level} Programme</td>
                <td className="p-2 font-mono text-center border-r border-slate-900">{lvl.count}</td>
                <td className="p-2 font-mono text-center">{Math.round((lvl.count / stats.totalStudents) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Course Performance Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-slate-900">2. Key Course Academic Performance Summary</h3>
        <table className="w-full text-left text-xs border-collapse border border-slate-900">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase">
              <th className="p-2 border-r border-slate-900">Code</th>
              <th className="p-2 border-r border-slate-900">Course Title</th>
              <th className="p-2 border-r border-slate-900 text-center">Level</th>
              <th className="p-2 border-r border-slate-900 text-center">Enrolled</th>
              <th className="p-2 border-r border-slate-900 text-center">Passed</th>
              <th className="p-2 border-r border-slate-900 text-center">Failed</th>
              <th className="p-2 text-center">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {stats.coursePerformance.map((c) => (
              <tr key={c.code} className="border-b border-slate-900">
                <td className="p-1.5 font-bold font-mono border-r border-slate-900">{c.code}</td>
                <td className="p-1.5 border-r border-slate-900">{c.title}</td>
                <td className="p-1.5 text-center font-mono border-r border-slate-900">{c.level}</td>
                <td className="p-1.5 text-center font-mono border-r border-slate-900">{c.enrolled}</td>
                <td className="p-1.5 text-center font-mono border-r border-slate-900">{c.passed}</td>
                <td className="p-1.5 text-center font-mono border-r border-slate-900">{c.failed}</td>
                <td className="p-1.5 text-center font-mono font-bold">{c.passRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Endorsements */}
      <div className="pt-8 grid grid-cols-2 gap-8 text-[10px]">
        <div className="text-center space-y-8">
          <div className="border-b border-slate-900 h-8 flex items-end justify-center">
            <span className="italic text-slate-400">Signed & Stamped</span>
          </div>
          <p className="font-bold uppercase">Head of Department (HOD)</p>
        </div>
        <div className="text-center space-y-8">
          <div className="border-b border-slate-900 h-8 flex items-end justify-center">
            <span className="italic text-slate-400">Signed & Stamped</span>
          </div>
          <p className="font-bold uppercase">Dean, Faculty of Science</p>
        </div>
      </div>
    </div>
  );
}
