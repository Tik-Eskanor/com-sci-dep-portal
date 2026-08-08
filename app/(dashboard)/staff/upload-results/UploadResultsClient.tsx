'use client';

import { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import { 
  UploadCloud, 
  Save, 
  Loader2, 
  Search, 
  FileText, 
  Download, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Filter, 
  BarChart3, 
  Award, 
  BookOpen, 
  RefreshCw,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { getRegisteredStudents, saveResults, addStudentByMatric } from './actions';

type Course = {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  level: string;
  semester: string;
};

type StudentResult = {
  studentId: string;
  matricNumber: string;
  name: string;
  level: string;
  caScore: number;
  examScore: number;
  isApproved: boolean;
  registrationStatus?: string;
};

interface UploadResultsClientProps {
  assignedCourses: Course[];
  initialCourseId?: string;
}

export default function UploadResultsClient({ assignedCourses, initialCourseId = '' }: UploadResultsClientProps) {
  const [selectedCourse, setSelectedCourse] = useState<string>(initialCourseId || (assignedCourses[0]?.id || ''));
  const [academicSession, setAcademicSession] = useState<string>('2024/2025');
  const [courseDetails, setCourseDetails] = useState<Course | null>(null);
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newMatricNumber, setNewMatricNumber] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFetchStudents = async (courseIdToFetch: string, sessionToFetch: string) => {
    if (!courseIdToFetch) return;

    setIsLoadingStudents(true);
    const res = await getRegisteredStudents(courseIdToFetch, sessionToFetch);
    setIsLoadingStudents(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      if (res.course) {
        setCourseDetails(res.course as Course);
      }
      if (res.students) {
        setStudents(res.students);
        if (res.students.length === 0) {
          toast.info('No students found for this course in the selected session.');
        } else {
          toast.success(`Loaded ${res.students.length} students for grading.`);
        }
      }
    }
  };

  // Auto-fetch students when page loads if initialCourseId is set or on initial selection
  useEffect(() => {
    let isMounted = true;
    if (selectedCourse) {
      void (async () => {
        setIsLoadingStudents(true);
        const res = await getRegisteredStudents(selectedCourse, academicSession);
        if (!isMounted) return;
        setIsLoadingStudents(false);

        if (res.error) {
          toast.error(res.error);
        } else {
          if (res.course) {
            setCourseDetails(res.course as Course);
          }
          if (res.students) {
            setStudents(res.students);
          }
        }
      })();
    }
    return () => {
      isMounted = false;
    };
  }, [selectedCourse, academicSession]);

  const handleScoreChange = (studentId: string, field: 'caScore' | 'examScore', value: string) => {
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) numValue = 0;

    // Enforce min and max limits
    if (field === 'caScore') numValue = Math.min(40, Math.max(0, numValue));
    if (field === 'examScore') numValue = Math.min(60, Math.max(0, numValue));

    setStudents(prev =>
      prev.map(student =>
        student.studentId === studentId
          ? { ...student, [field]: numValue }
          : student
      )
    );
  };

  const handleAddMissingStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatricNumber.trim()) {
      toast.error('Please enter a Matric Number.');
      return;
    }

    if (!selectedCourse) {
      toast.error('Please select a course first.');
      return;
    }

    setIsAddingStudent(true);
    const res = await addStudentByMatric(selectedCourse, academicSession, newMatricNumber);
    setIsAddingStudent(false);

    if (res.error) {
      toast.error(res.error);
    } else if (res.student) {
      // Check if already in list
      if (students.some(s => s.studentId === res.student.studentId)) {
        toast.info(`Student ${res.student.matricNumber} is already in the list.`);
      } else {
        setStudents(prev => [...prev, res.student!]);
        toast.success(`Added ${res.student.name} (${res.student.matricNumber}) to sheet.`);
        setNewMatricNumber('');
        setIsAddStudentOpen(false);
      }
    }
  };

  const handleQuickFillCA = () => {
    const defaultScore = 25;
    setStudents(prev =>
      prev.map(s => ({
        ...s,
        caScore: s.caScore === 0 ? defaultScore : s.caScore
      }))
    );
    toast.success(`Applied default CA score (${defaultScore}/40) to empty entries.`);
  };

  // CSV Export Template
  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.error('No student records to export.');
      return;
    }

    const currentCourse = assignedCourses.find(c => c.id === selectedCourse) || courseDetails;
    const courseCode = currentCourse?.code || 'COURSE';

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "S/N,Matric Number,Student Name,Level,CA Score (40),Exam Score (60),Total (100)\n";

    students.forEach((s, idx) => {
      const total = s.caScore + s.examScore;
      csvContent += `${idx + 1},"${s.matricNumber}","${s.name}","${s.level}",${s.caScore},${s.examScore},${total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${courseCode}_Grading_Sheet_${academicSession.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Downloaded CSV grading template!');
  };

  // CSV Bulk Import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/);
        
        let matchCount = 0;
        const updatedStudents = [...students];

        lines.forEach(line => {
          if (!line.trim()) return;
          const parts = line.split(',').map(p => p.replaceAll('"', '').trim());
          if (parts.length < 5) return;

          const matric = parts[1];
          const ca = parseInt(parts[4], 10);
          const exam = parseInt(parts[5], 10);

          if (matric && !isNaN(ca) && !isNaN(exam)) {
            const index = updatedStudents.findIndex(
              s => s.matricNumber.toLowerCase() === matric.toLowerCase()
            );
            if (index !== -1) {
              updatedStudents[index] = {
                ...updatedStudents[index],
                caScore: Math.min(40, Math.max(0, ca)),
                examScore: Math.min(60, Math.max(0, exam))
              };
              matchCount++;
            }
          }
        });

        if (matchCount > 0) {
          setStudents(updatedStudents);
          toast.success(`Imported scores for ${matchCount} students from CSV!`);
        } else {
          toast.warning('No matching student matric numbers found in CSV file.');
        }
      } catch {
        toast.error('Failed to parse CSV file. Please check formatting.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleSaveResults = () => {
    if (students.length === 0) {
      toast.error('No students loaded to submit.');
      return;
    }

    startTransition(async () => {
      const res = await saveResults(
        selectedCourse,
        academicSession,
        students.map(s => ({
          studentId: s.studentId,
          caScore: s.caScore,
          examScore: s.examScore
        }))
      );

      if (res.success) {
        toast.success(res.message || 'Results saved and submitted to HOD!');
        // Refresh sheet
        handleFetchStudents(selectedCourse, academicSession);
      } else {
        toast.error(res.error || 'Failed to save results.');
      }
    });
  };

  // Helper function to calculate Grade
  const calculateGrade = (total: number) => {
    if (total >= 75) return { grade: 'A', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (total >= 70) return { grade: 'AB', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
    if (total >= 65) return { grade: 'B', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (total >= 60) return { grade: 'BC', color: 'bg-blue-50 text-blue-700 border-blue-100' };
    if (total >= 55) return { grade: 'C', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    if (total >= 50) return { grade: 'CD', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    if (total >= 45) return { grade: 'D', color: 'bg-amber-100 text-amber-900 border-amber-200' };
    if (total >= 40) return { grade: 'E', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { grade: 'F', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  // Analytics Computation
  const stats = useMemo(() => {
    if (students.length === 0) return { total: 0, passed: 0, failed: 0, avgCa: 0, avgExam: 0, avgTotal: 0, passRate: 0 };
    
    let totalCa = 0;
    let totalExam = 0;
    let totalScoreSum = 0;
    let passedCount = 0;

    students.forEach(s => {
      totalCa += s.caScore;
      totalExam += s.examScore;
      const tot = s.caScore + s.examScore;
      totalScoreSum += tot;
      if (tot >= 40) passedCount++;
    });

    const count = students.length;
    return {
      total: count,
      passed: passedCount,
      failed: count - passedCount,
      avgCa: Math.round(totalCa / count),
      avgExam: Math.round(totalExam / count),
      avgTotal: Math.round(totalScoreSum / count),
      passRate: Math.round((passedCount / count) * 100)
    };
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.matricNumber.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (gradeFilter === 'ALL') return true;
      const total = student.caScore + student.examScore;
      const g = calculateGrade(total).grade;

      if (gradeFilter === 'PASS') return total >= 40;
      if (gradeFilter === 'FAIL') return total < 40;
      return g === gradeFilter;
    });
  }, [students, searchQuery, gradeFilter]);

  const currentCourse = assignedCourses.find(c => c.id === selectedCourse) || courseDetails;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[var(--color-poly-primary)] to-[var(--color-poly-primary-light)] text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-amber-200 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Polytechnic Academic Results Management System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Course Results & Grading Portal
          </h1>
          <p className="text-sm text-slate-100/90 max-w-2xl">
            Input, compute, and submit continuous assessment (CA) and semester examination scores for HOD review & publication.
          </p>
        </div>
      </div>

      {/* Course & Session Selector Card */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Course Dropdown */}
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[var(--color-poly-primary)]" />
              Select Allocated Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] focus:bg-white transition-all"
            >
              <option value="">-- Choose Course --</option>
              {assignedCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title} ({c.level})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Session */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Academic Session
            </label>
            <select
              value={academicSession}
              onChange={(e) => setAcademicSession(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] focus:bg-white transition-all"
            >
              <option value="2024/2025">2024/2025 Session</option>
              <option value="2023/2024">2023/2024 Session</option>
              <option value="2025/2026">2025/2026 Session</option>
            </select>
          </div>

          {/* Load Button */}
          <div className="md:col-span-3">
            <button
              onClick={() => handleFetchStudents(selectedCourse, academicSession)}
              disabled={isLoadingStudents || !selectedCourse}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-poly-primary)] text-white px-5 py-2.5 rounded-lg hover:bg-[var(--color-poly-primary-light)] transition-colors font-bold text-sm disabled:opacity-50 shadow-2xs"
            >
              {isLoadingStudents ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading Sheet...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Load Grading Sheet
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Course Quick Info */}
        {currentCourse && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-xs border border-blue-200">
                {currentCourse.code}
              </span>
              <span className="font-bold text-slate-800 text-sm">{currentCourse.title}</span>
            </div>

            <div className="flex items-center gap-4 text-slate-600 font-medium">
              <span>Credit Units: <strong className="text-slate-900">{currentCourse.creditUnits || 3} Units</strong></span>
              <span>•</span>
              <span>Level: <strong className="text-slate-900">{currentCourse.level || 'ND1'}</strong></span>
              <span>•</span>
              <span>Semester: <strong className="text-slate-900">{currentCourse.semester || 'First'}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Summary Header (If students loaded) */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Candidates</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Enrolled for grading</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Average Score</div>
            <div className="text-2xl font-extrabold text-[var(--color-poly-primary)] mt-1">{stats.avgTotal} <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">CA Avg: {stats.avgCa} | Exam Avg: {stats.avgExam}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pass Rate</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.passRate}%</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">{stats.passed} Passed (Score ≥ 40)</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carryovers / Fail</div>
            <div className="text-2xl font-extrabold text-red-600 mt-1">{stats.failed}</div>
            <div className="text-[11px] text-red-600 font-semibold mt-0.5">{stats.failed > 0 ? 'Requires Retake' : 'No Failures'}</div>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden space-y-0">
          {/* Table Toolbar & Actions */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            {/* Left: Search & Filter */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name or matric..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                />
              </div>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
              >
                <option value="ALL">All Grades</option>
                <option value="PASS">Passes Only (≥ 40)</option>
                <option value="FAIL">Fails Only (&lt; 40)</option>
                <option value="A">Grade A (75+)</option>
                <option value="AB">Grade AB (70-74)</option>
                <option value="B">Grade B (65-69)</option>
                <option value="BC">Grade BC (60-64)</option>
                <option value="C">Grade C (55-59)</option>
                <option value="F">Grade F (&lt; 40)</option>
              </select>
            </div>

            {/* Right: CSV Import/Export & Add Student */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleCSVImport}
                accept=".csv"
                className="hidden"
              />

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                title="Download formatted CSV grading sheet"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                Export CSV Sheet
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                title="Bulk import scores from CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Import CSV Scores
              </button>

              <button
                type="button"
                onClick={() => setIsAddStudentOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                Add Missing Student
              </button>
            </div>
          </div>

          {/* Quick Helper Bar */}
          <div className="px-4 py-2 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Maximum allowable scores: <strong className="font-bold">CA = 40 Marks</strong>, <strong className="font-bold">Exam = 60 Marks</strong> (Total = 100 Marks).
              </span>
            </div>
            <button
              onClick={handleQuickFillCA}
              className="text-[11px] font-bold text-blue-700 hover:underline bg-white px-2 py-0.5 rounded border border-blue-200"
            >
              Fill default CA (25/40) for unassigned
            </button>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center w-12">S/N</th>
                  <th className="px-4 py-3">Matric Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center">Level</th>
                  <th className="px-4 py-3 text-center w-32">CA Score (40)</th>
                  <th className="px-4 py-3 text-center w-32">Exam Score (60)</th>
                  <th className="px-4 py-3 text-center w-28">Total (100)</th>
                  <th className="px-4 py-3 text-center w-24">Grade</th>
                  <th className="px-4 py-3 text-center w-32">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                      No matching student records found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => {
                    const total = student.caScore + student.examScore;
                    const gradeInfo = calculateGrade(total);

                    return (
                      <tr key={student.studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-center font-mono text-xs text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[var(--color-poly-primary)] text-xs">
                          {student.matricNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 text-xs">
                          {student.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                            {student.level}
                          </span>
                        </td>
                        {/* CA Score Input */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="40"
                            value={student.caScore}
                            onChange={(e) => handleScoreChange(student.studentId, 'caScore', e.target.value)}
                            className="w-20 px-2 py-1 text-center font-mono text-xs font-bold border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] bg-white text-slate-900 shadow-2xs"
                          />
                        </td>
                        {/* Exam Score Input */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            value={student.examScore}
                            onChange={(e) => handleScoreChange(student.studentId, 'examScore', e.target.value)}
                            className="w-20 px-2 py-1 text-center font-mono text-xs font-bold border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] bg-white text-slate-900 shadow-2xs"
                          />
                        </td>
                        {/* Total Computed */}
                        <td className="px-4 py-3 text-center">
                          <span className={`font-mono font-extrabold text-sm ${total < 40 ? 'text-red-600' : 'text-slate-900'}`}>
                            {total}
                          </span>
                        </td>
                        {/* Grade Badge */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block font-mono font-extrabold text-xs px-2.5 py-0.5 rounded border ${gradeInfo.color}`}>
                            {gradeInfo.grade}
                          </span>
                        </td>
                        {/* Approval Status */}
                        <td className="px-4 py-3 text-center">
                          {student.isApproved ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                              Pending HOD
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Save & Submit Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-500 space-y-0.5">
              <p className="font-semibold text-slate-700">
                Total candidates in sheet: {students.length} | Showing: {filteredStudents.length}
              </p>
              <p className="text-[11px] italic">
                Saving will publish your grades to the HOD dashboard for final departmental verification.
              </p>
            </div>

            <button
              onClick={handleSaveResults}
              disabled={isPending}
              className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting to HOD...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Submit Results to HOD
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Add Missing Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsAddStudentOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--color-poly-primary)]" />
                Add Missing Student
              </h3>
              <p className="text-xs text-slate-500">
                Enter the matriculation number of the student to add them directly to this grading sheet.
              </p>
            </div>

            <form onSubmit={handleAddMissingStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Matric Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. ND/CS/2024/001"
                  value={newMatricNumber}
                  onChange={(e) => setNewMatricNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingStudent}
                  className="px-5 py-2 bg-[var(--color-poly-primary)] text-white rounded-lg text-xs font-bold hover:bg-[var(--color-poly-primary-light)] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isAddingStudent && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Find & Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
