'use client';

import { useState, useTransition, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Sparkles, 
  Loader2, 
  BookOpen, 
  Users, 
  Award, 
  ChevronRight, 
  BarChart3, 
  AlertTriangle,
  X,
  CheckCheck,
  RotateCcw,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  approveCourseResults, 
  revokeCourseResults, 
  batchApproveAllPendingResults, 
  getCourseDetailedResults, 
  toggleSingleResultApproval 
} from './actions';

export type CourseSummary = {
  courseId: string;
  code: string;
  title: string;
  creditUnits: number;
  level: string;
  semester: string;
  lecturerName: string;
  lecturerTitle: string;
  totalStudents: number;
  approvedCount: number;
  pendingCount: number;
  avgScore: number;
  passCount: number;
  failCount: number;
  isFullyApproved: boolean;
  gradeDistribution: {
    A: number;
    AB: number;
    B: number;
    BC: number;
    C: number;
    CD: number;
    D: number;
    E: number;
    F: number;
  };
};

export type StudentResultDetail = {
  id: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  level: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
  isApproved: boolean;
};

interface ApproveResultsClientProps {
  initialCourses: CourseSummary[];
  academicSession: string;
}

export default function ApproveResultsClient({ 
  initialCourses, 
  academicSession: defaultSession 
}: ApproveResultsClientProps) {
  const [courses, setCourses] = useState<CourseSummary[]>(initialCourses);
  const [selectedSession, setSelectedSession] = useState<string>(defaultSession || '2024/2025');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Inspection Modal state
  const [inspectingCourse, setInspectingCourse] = useState<CourseSummary | null>(null);
  const [inspectResults, setInspectResults] = useState<StudentResultDetail[]>([]);
  const [isLoadingInspect, setIsLoadingInspect] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Transitions for Server Actions
  const [isPending, startTransition] = useTransition();
  const [actionLoadingCourseId, setActionLoadingCourseId] = useState<string | null>(null);

  // Overall Stats
  const stats = useMemo(() => {
    const totalCourses = courses.length;
    const pendingCourses = courses.filter(c => !c.isFullyApproved).length;
    const approvedCourses = courses.filter(c => c.isFullyApproved).length;
    
    let totalGradedCandidates = 0;
    let totalPasses = 0;
    courses.forEach(c => {
      totalGradedCandidates += c.totalStudents;
      totalPasses += c.passCount;
    });

    const passRate = totalGradedCandidates > 0 
      ? Math.round((totalPasses / totalGradedCandidates) * 100) 
      : 0;

    return {
      totalCourses,
      pendingCourses,
      approvedCourses,
      totalGradedCandidates,
      passRate
    };
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = 
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.lecturerName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedLevel !== 'ALL' && course.level !== selectedLevel) return false;
      if (selectedSemester !== 'ALL' && course.semester !== selectedSemester) return false;

      if (selectedStatus === 'PENDING') return !course.isFullyApproved;
      if (selectedStatus === 'APPROVED') return course.isFullyApproved;

      return true;
    });
  }, [courses, searchQuery, selectedLevel, selectedSemester, selectedStatus]);

  // Handler: Approve Course Results
  const handleApproveCourse = (courseId: string) => {
    setActionLoadingCourseId(courseId);
    startTransition(async () => {
      const res = await approveCourseResults(courseId, selectedSession);
      setActionLoadingCourseId(null);

      if (res.success) {
        toast.success(res.message);
        setCourses(prev => prev.map(c => {
          if (c.courseId === courseId) {
            return {
              ...c,
              isFullyApproved: true,
              approvedCount: c.totalStudents,
              pendingCount: 0
            };
          }
          return c;
        }));

        if (inspectingCourse?.courseId === courseId) {
          setInspectResults(prev => prev.map(r => ({ ...r, isApproved: true })));
          setInspectingCourse(prev => prev ? { ...prev, isFullyApproved: true, approvedCount: prev.totalStudents, pendingCount: 0 } : null);
        }
      } else {
        toast.error(res.error || 'Failed to approve course.');
      }
    });
  };

  // Handler: Revoke Course Approval
  const handleRevokeCourse = (courseId: string) => {
    setActionLoadingCourseId(courseId);
    startTransition(async () => {
      const res = await revokeCourseResults(courseId, selectedSession);
      setActionLoadingCourseId(null);

      if (res.success) {
        toast.success(res.message);
        setCourses(prev => prev.map(c => {
          if (c.courseId === courseId) {
            return {
              ...c,
              isFullyApproved: false,
              approvedCount: 0,
              pendingCount: c.totalStudents
            };
          }
          return c;
        }));

        if (inspectingCourse?.courseId === courseId) {
          setInspectResults(prev => prev.map(r => ({ ...r, isApproved: false })));
          setInspectingCourse(prev => prev ? { ...prev, isFullyApproved: false, approvedCount: 0, pendingCount: prev.totalStudents } : null);
        }
      } else {
        toast.error(res.error || 'Failed to revoke course approval.');
      }
    });
  };

  // Handler: Batch Approve All Pending Results
  const handleBatchApproveAll = () => {
    if (stats.pendingCourses === 0) {
      toast.info('No pending course results to approve.');
      return;
    }

    startTransition(async () => {
      const res = await batchApproveAllPendingResults(selectedSession);
      if (res.success) {
        toast.success(res.message);
        setCourses(prev => prev.map(c => ({
          ...c,
          isFullyApproved: true,
          approvedCount: c.totalStudents,
          pendingCount: 0
        })));
      } else {
        toast.error(res.error || 'Failed to execute batch approval.');
      }
    });
  };

  // Handler: Open Detailed Inspection Modal
  const handleInspectCourse = async (course: CourseSummary) => {
    setInspectingCourse(course);
    setIsLoadingInspect(true);
    setModalSearch('');

    const res = await getCourseDetailedResults(course.courseId, selectedSession);
    setIsLoadingInspect(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.results) {
      setInspectResults(res.results as StudentResultDetail[]);
    }
  };

  // Handler: Toggle single result approval in modal
  const handleToggleSingleResult = async (resultId: string, currentStatus: boolean) => {
    const res = await toggleSingleResultApproval(resultId, !currentStatus);
    if (res.success) {
      toast.success(res.message);
      setInspectResults(prev => prev.map(r => {
        if (r.id === resultId) {
          return { ...r, isApproved: res.isApproved ?? !currentStatus };
        }
        return r;
      }));

      // Update course summary in state
      if (inspectingCourse) {
        setCourses(prev => prev.map(c => {
          if (c.courseId === inspectingCourse.courseId) {
            const newApprovedCount = res.isApproved ? c.approvedCount + 1 : c.approvedCount - 1;
            const newPendingCount = c.totalStudents - newApprovedCount;
            return {
              ...c,
              approvedCount: newApprovedCount,
              pendingCount: newPendingCount,
              isFullyApproved: newApprovedCount === c.totalStudents
            };
          }
          return c;
        }));
      }
    } else {
      toast.error(res.error || 'Failed to toggle status.');
    }
  };

  // CSV Export for inspected course
  const handleExportInspectedCSV = () => {
    if (!inspectingCourse || inspectResults.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `HOD Official Results Audit - ${inspectingCourse.code}: ${inspectingCourse.title}\n`;
    csvContent += `Session: ${selectedSession}, Lecturer: ${inspectingCourse.lecturerName}\n\n`;
    csvContent += "S/N,Matric Number,Student Name,Level,CA Score (40),Exam Score (60),Total Score (100),Grade,Grade Point,HOD Status\n";

    inspectResults.forEach((r, idx) => {
      csvContent += `${idx + 1},"${r.matricNumber}","${r.studentName}","${r.level}",${r.caScore},${r.examScore},${r.totalScore},"${r.grade}",${r.gradePoint},"${r.isApproved ? 'Approved' : 'Pending'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${inspectingCourse.code}_HOD_Audit_Sheet_${selectedSession.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported official audit sheet for ${inspectingCourse.code}!`);
  };

  // Filtered modal results
  const filteredModalResults = useMemo(() => {
    return inspectResults.filter(r => 
      r.studentName.toLowerCase().includes(modalSearch.toLowerCase()) ||
      r.matricNumber.toLowerCase().includes(modalSearch.toLowerCase())
    );
  }, [inspectResults, modalSearch]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[var(--color-poly-primary)] to-[var(--color-poly-primary-light)] text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-amber-200 uppercase border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Head of Department Office • Result Verification & Approval Portal
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Departmental Result Approvals
          </h1>

          <p className="text-sm text-slate-100/90 max-w-3xl leading-relaxed">
            Review, verify grade distributions, inspect individual student marks, and officially endorse lecturer-submitted course scores for publication to student portals.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Courses Graded */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Courses with Results
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalCourses}</div>
          <p className="text-xs text-slate-500 mt-1">Courses uploaded by lecturers</p>
        </div>

        {/* Card 2: Pending HOD Approval */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600">{stats.pendingCourses}</div>
          <p className="text-xs text-slate-500 mt-1">Courses awaiting your sign-off</p>
        </div>

        {/* Card 3: Approved Courses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approved Courses
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{stats.approvedCourses}</div>
          <p className="text-xs text-slate-500 mt-1">Officially published results</p>
        </div>

        {/* Card 4: Total Graded Candidates */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Graded Candidates
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalGradedCandidates}</div>
          <p className="text-xs text-slate-500 mt-1">Student records • {stats.passRate}% Pass Rate</p>
        </div>
      </div>

      {/* Control Panel: Batch Action & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--color-poly-primary)]" />
              Departmental Results Audit & Filters
            </h2>
            <p className="text-xs text-slate-500">Filter submitted results by level, semester, or lecturer.</p>
          </div>

          {/* Quick Batch Approve Button */}
          {stats.pendingCourses > 0 && (
            <button
              onClick={handleBatchApproveAll}
              disabled={isPending}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-2xs disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Approve All {stats.pendingCourses} Pending Course Results
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Bar */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, title, or lecturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] focus:bg-white"
            />
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
            >
              <option value="ALL">All Levels</option>
              <option value="ND1">ND1 Level</option>
              <option value="ND2">ND2 Level</option>
              <option value="HND1">HND1 Level</option>
              <option value="HND2">HND2 Level</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
            >
              <option value="ALL">All Semesters</option>
              <option value="First">First Semester</option>
              <option value="Second">Second Semester</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Fully Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Course Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--color-poly-primary)]" />
            Submitted Course Results ({filteredCourses.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing results for <strong className="text-slate-800">{selectedSession} Session</strong>
          </span>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Course Results Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are no uploaded result records matching your active filters for this session. Lecturers can upload grades via the Lecturer Portal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCourses.map((course) => {
              const passRate = course.totalStudents > 0
                ? Math.round((course.passCount / course.totalStudents) * 100)
                : 0;

              const isActionLoading = actionLoadingCourseId === course.courseId;

              return (
                <div
                  key={course.courseId}
                  className={`bg-white rounded-xl border ${
                    course.isFullyApproved ? 'border-emerald-200 shadow-2xs' : 'border-amber-200 shadow-sm'
                  } p-5 space-y-4 transition-all hover:shadow-md flex flex-col justify-between`}
                >
                  {/* Top Row: Course Header & Status Badge */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-100">
                            {course.code}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 uppercase">
                            {course.level} • {course.semester} Sem • {course.creditUnits} Units
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                          {course.title}
                        </h3>
                      </div>

                      {/* Status Tag */}
                      {course.isFullyApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          Pending HOD
                        </span>
                      )}
                    </div>

                    {/* Lecturer Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Course Lecturer: <strong className="text-slate-900 font-bold">{course.lecturerTitle} {course.lecturerName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Class Stats & Grade Distribution */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Candidates</span>
                        <span className="font-bold text-slate-900 text-sm">{course.totalStudents}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Class Avg</span>
                        <span className="font-bold text-slate-900 text-sm">{course.avgScore} / 100</span>
                      </div>
                      <div className={`p-2 rounded-lg border ${passRate >= 60 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Pass Rate</span>
                        <span className="font-bold text-sm">{passRate}% ({course.passCount} Passed)</span>
                      </div>
                    </div>

                    {/* Grade Badges Summary */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono pt-1">
                      <span className="text-slate-400 font-sans font-bold text-[10px] uppercase mr-1">Distribution:</span>
                      {course.gradeDistribution.A > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">A: {course.gradeDistribution.A}</span>}
                      {course.gradeDistribution.AB > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">AB: {course.gradeDistribution.AB}</span>}
                      {course.gradeDistribution.B > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">B: {course.gradeDistribution.B}</span>}
                      {course.gradeDistribution.BC > 0 && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">BC: {course.gradeDistribution.BC}</span>}
                      {course.gradeDistribution.C > 0 && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">C: {course.gradeDistribution.C}</span>}
                      {course.gradeDistribution.CD > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">CD: {course.gradeDistribution.CD}</span>}
                      {course.gradeDistribution.D > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">D: {course.gradeDistribution.D}</span>}
                      {course.gradeDistribution.E > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">E: {course.gradeDistribution.E}</span>}
                      {course.gradeDistribution.F > 0 && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">F: {course.gradeDistribution.F}</span>}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    {/* Review & Inspect Button */}
                    <button
                      onClick={() => handleInspectCourse(course)}
                      className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      Review & Audit Sheet
                    </button>

                    {/* Approve or Revoke Button */}
                    {course.isFullyApproved ? (
                      <button
                        onClick={() => handleRevokeCourse(course.courseId)}
                        disabled={isPending || isActionLoading}
                        className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors border border-amber-200 flex items-center gap-1 disabled:opacity-50"
                        title="Revoke approval and return to Pending status"
                      >
                        {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Revoke Sign-off
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApproveCourse(course.courseId)}
                        disabled={isPending || isActionLoading}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        Approve Results
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Inspection Modal */}
      {inspectingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                    {inspectingCourse.code}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {inspectingCourse.level} • {inspectingCourse.semester} Semester
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {inspectingCourse.title}
                </h3>
                <p className="text-xs text-slate-300">
                  Lecturer: {inspectingCourse.lecturerTitle} {inspectingCourse.lecturerName}
                </p>
              </div>

              <button
                onClick={() => setInspectingCourse(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Toolbar & Export */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter student or matric..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportInspectedCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Export Audit Sheet (CSV)
                </button>

                {inspectingCourse.isFullyApproved ? (
                  <button
                    onClick={() => handleRevokeCourse(inspectingCourse.courseId)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Revoke Approval
                  </button>
                ) : (
                  <button
                    onClick={() => handleApproveCourse(inspectingCourse.courseId)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve All Students
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: Results Table */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {isLoadingInspect ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--color-poly-primary)]" />
                  <p className="text-xs font-bold">Loading candidate grade records...</p>
                </div>
              ) : inspectResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No individual results recorded for this course yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-center w-10">S/N</th>
                        <th className="px-3 py-2">Matric Number</th>
                        <th className="px-3 py-2">Student Name</th>
                        <th className="px-3 py-2 text-center">CA /40</th>
                        <th className="px-3 py-2 text-center">Exam /60</th>
                        <th className="px-3 py-2 text-center">Total /100</th>
                        <th className="px-3 py-2 text-center">Grade</th>
                        <th className="px-3 py-2 text-center">GP</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center">Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredModalResults.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-3 py-2 font-mono font-bold text-[var(--color-poly-primary)]">{r.matricNumber}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900">{r.studentName}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-700">{r.caScore}</td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-700">{r.examScore}</td>
                          <td className={`px-3 py-2 text-center font-mono font-extrabold ${r.totalScore < 40 ? 'text-red-600' : 'text-slate-900'}`}>
                            {r.totalScore}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block font-mono font-extrabold px-2 py-0.5 rounded text-[10px] ${
                              r.totalScore >= 70 ? 'bg-emerald-100 text-emerald-800' :
                              r.totalScore >= 50 ? 'bg-blue-100 text-blue-800' :
                              r.totalScore >= 40 ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {r.grade}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-600">{r.gradePoint.toFixed(1)}</td>
                          <td className="px-3 py-2 text-center">
                            {r.isApproved ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleToggleSingleResult(r.id, r.isApproved)}
                              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                                r.isApproved
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              }`}
                            >
                              {r.isApproved ? 'Unapprove' : 'Approve'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setInspectingCourse(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
