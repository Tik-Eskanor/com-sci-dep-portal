'use client';

import { useState, useMemo } from 'react';
import { 
  Printer, 
  Search, 
  Award, 
  BookOpen, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  X, 
  ShieldCheck, 
  User, 
  FileText,
  Sparkles,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export type ResultItem = {
  id: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
  academicSession: string;
  semester: 'First' | 'Second';
  level: string;
  isApproved: boolean;
};

type Props = {
  studentName: string;
  matricNumber: string;
  studentLevel: string;
  academicSession: string;
  passportPhotoUrl?: string;
  results: ResultItem[];
};

export default function ResultsClient({
  studentName,
  matricNumber,
  studentLevel,
  academicSession,
  passportPhotoUrl,
  results
}: Props) {
  // Available Sessions derived from results or defaults
  const availableSessions = useMemo(() => {
    const sessions = Array.from(new Set(results.map(r => r.academicSession)));
    if (!sessions.includes(academicSession)) {
      sessions.unshift(academicSession);
    }
    return sessions.sort().reverse();
  }, [results, academicSession]);

  const [selectedSession, setSelectedSession] = useState<string>(
    availableSessions[0] || academicSession
  );
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Filter results by session and semester
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const sessionMatch = r.academicSession === selectedSession;
      const semesterMatch = selectedSemester === 'All' || r.semester === selectedSemester;
      return sessionMatch && semesterMatch;
    });
  }, [results, selectedSession, selectedSemester]);

  // Overall Cumulative Calculations across ALL approved results up to selected session
  const cumulativeStats = useMemo(() => {
    const allApproved = results.filter(r => r.isApproved);
    const totalUnitsAttempted = allApproved.reduce((sum, r) => sum + r.creditUnits, 0);
    const totalUnitsPassed = allApproved
      .filter(r => r.grade !== 'F')
      .reduce((sum, r) => sum + r.creditUnits, 0);
    const totalQualityPoints = allApproved.reduce(
      (sum, r) => sum + r.gradePoint * r.creditUnits,
      0
    );
    const cgpa = totalUnitsAttempted > 0 ? totalQualityPoints / totalUnitsAttempted : 0;

    let diplomaClass = 'Pass';
    let classColor = 'bg-slate-100 text-slate-800 border-slate-200';
    if (cgpa >= 3.5) {
      diplomaClass = 'Distinction';
      classColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (cgpa >= 3.0) {
      diplomaClass = 'Upper Credit';
      classColor = 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (cgpa >= 2.5) {
      diplomaClass = 'Lower Credit';
      classColor = 'bg-amber-100 text-amber-800 border-amber-300';
    } else if (cgpa >= 2.0) {
      diplomaClass = 'Pass';
      classColor = 'bg-slate-100 text-slate-800 border-slate-300';
    } else {
      diplomaClass = 'Academic Warning';
      classColor = 'bg-red-100 text-red-800 border-red-300';
    }

    return {
      totalUnitsAttempted,
      totalUnitsPassed,
      totalQualityPoints,
      cgpa: cgpa.toFixed(2),
      diplomaClass,
      classColor,
      carryovers: allApproved.filter(r => r.grade === 'F').length
    };
  }, [results]);

  // Selected Semester Specific Calculations
  const selectedSemesterStats = useMemo(() => {
    const totalUnits = filteredResults.reduce((sum, r) => sum + r.creditUnits, 0);
    const totalQualityPoints = filteredResults.reduce(
      (sum, r) => sum + r.gradePoint * r.creditUnits,
      0
    );
    const gpa = totalUnits > 0 ? totalQualityPoints / totalUnits : 0;
    const passedUnits = filteredResults
      .filter(r => r.grade !== 'F')
      .reduce((sum, r) => sum + r.creditUnits, 0);

    return {
      totalUnits,
      passedUnits,
      totalQualityPoints,
      gpa: gpa.toFixed(2)
    };
  }, [filteredResults]);

  // Handle Printing (Direct Window popup for iframe isolation or Fallback to window.print)
  const handlePrint = () => {
    toast.info('Preparing Statement of Results for printing...');
    const printElement = document.getElementById('printable-statement-content');

    if (printElement) {
      try {
        const printWin = window.open('', '_blank', 'width=900,height=1000');
        if (printWin) {
          printWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Statement of Results - ${studentName} (${matricNumber})</title>
                <meta charset="utf-8">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  @page { size: A4 portrait; margin: 12mm; }
                  body { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; color: #000; background: #fff; padding: 15px; margin: 0; }
                  .border-slate-900 { border-color: #000 !important; }
                  .bg-slate-900 { background-color: #0f172a !important; color: #fff !important; }
                  .text-slate-900 { color: #0f172a !important; }
                  .bg-emerald-950 { background-color: #022c22 !important; }
                  .text-amber-400 { color: #fbbf24 !important; }
                  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
                  th, td { border: 1px solid #000; padding: 6px; }
                  th { background-color: #f1f5f9; font-weight: bold; }
                </style>
              </head>
              <body>
                <div style="max-width: 800px; margin: 0 auto;">
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
      toast.error('Unable to open print dialog automatically. Press Ctrl+P or Cmd+P to print.');
    }
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
      case 'AB':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'B':
      case 'BC':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C':
      case 'CD':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'D':
      case 'E':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'F':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden Container for Popup Printing */}
      <div className="hidden print:block text-black bg-white font-serif p-6">
        <PrintableStatement 
          studentName={studentName}
          matricNumber={matricNumber}
          studentLevel={studentLevel}
          academicSession={selectedSession}
          selectedSemester={selectedSemester}
          results={filteredResults}
          cumulativeStats={cumulativeStats}
          selectedSemesterStats={selectedSemesterStats}
          passportPhotoUrl={passportPhotoUrl}
        />
      </div>

      {/* Screen Controls Header */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[var(--color-poly-primary)] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                Department of Computer Science
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> HOD & Senate Approved
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-poly-text-heading)]">
              Statement of Academic Results
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Student: <strong className="text-slate-700">{studentName}</strong> ({matricNumber}) &bull; Level: {studentLevel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 border border-slate-200 shadow-2xs"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              Preview Official Statement
            </button>

            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors inline-flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Statement
            </button>
          </div>
        </div>

        {/* Academic Performance Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CGPA & Class Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cumulative GPA (CGPA)</span>
              <Award className="w-5 h-5 text-[var(--color-poly-secondary)]" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-[var(--color-poly-primary)]">
                {cumulativeStats.cgpa}
              </span>
              <span className="text-xs font-bold text-slate-400">/ 4.00</span>
            </div>
            <div className="mt-3">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase border ${cumulativeStats.classColor}`}>
                {cumulativeStats.diplomaClass}
              </span>
            </div>
          </div>

          {/* Current Selection Semester GPA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester GPA</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                {selectedSemesterStats.gpa}
              </span>
              <span className="text-xs font-bold text-slate-400">GPA</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-3">
              Points: <strong className="text-slate-800">{selectedSemesterStats.totalQualityPoints}</strong> &bull; Units: <strong className="text-slate-800">{selectedSemesterStats.totalUnits}</strong>
            </p>
          </div>

          {/* Total Units Passed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Units Passed</span>
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                {cumulativeStats.totalUnitsPassed}
              </span>
              <span className="text-xs font-bold text-slate-400">/ {cumulativeStats.totalUnitsAttempted} Units</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-3">
              Passed Rate: <strong className="text-emerald-700">{cumulativeStats.totalUnitsAttempted > 0 ? Math.round((cumulativeStats.totalUnitsPassed / cumulativeStats.totalUnitsAttempted) * 100) : 0}%</strong>
            </p>
          </div>

          {/* Academic Standing & Carryovers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Standing</span>
              {cumulativeStats.carryovers === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black ${cumulativeStats.carryovers === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {cumulativeStats.carryovers === 0 ? 'Good Standing' : `${cumulativeStats.carryovers} Carryover(s)`}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-3">
              {cumulativeStats.carryovers === 0 ? 'Clear academic record' : 'Requires re-sitting failed courses'}
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Academic Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[var(--color-poly-primary)] focus:border-transparent bg-slate-50"
            >
              {availableSessions.map(session => (
                <option key={session} value={session}>
                  {session} Academic Session
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Semester Filter
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[var(--color-poly-primary)] focus:border-transparent bg-slate-50"
            >
              <option value="All">All Semesters ({selectedSession})</option>
              <option value="First">First Semester</option>
              <option value="Second">Second Semester</option>
            </select>
          </div>

          <button 
            type="button"
            onClick={handlePrint}
            className="w-full md:w-auto px-6 py-2.5 bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 h-[42px] shadow-2xs"
          >
            <Printer className="w-4 h-4" />
            Print Statement
          </button>
        </div>

        {/* Main Results Table */}
        {filteredResults.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Approved Results Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No results match your selected filter ({selectedSession} - {selectedSemester} Semester). Results may still be undergoing HOD or Senate processing.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Approved Course Grades ({selectedSession} &bull; {selectedSemester === 'All' ? 'Full Session' : `${selectedSemester} Semester`})
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {filteredResults.length} registered course evaluation(s).
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="text-xs font-bold text-[var(--color-poly-primary)] hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Printer className="w-3.5 h-3.5" /> Direct Print Form
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5 w-12 text-center">S/N</th>
                    <th className="px-5 py-3.5 w-28">Course Code</th>
                    <th className="px-5 py-3.5">Course Title</th>
                    <th className="px-4 py-3.5 text-center w-20">Units</th>
                    <th className="px-4 py-3.5 text-center w-20">CA (40)</th>
                    <th className="px-4 py-3.5 text-center w-20">Exam (60)</th>
                    <th className="px-4 py-3.5 text-center w-20">Total (100)</th>
                    <th className="px-4 py-3.5 text-center w-20">Grade</th>
                    <th className="px-4 py-3.5 text-center w-20">Points</th>
                    <th className="px-4 py-3.5 text-center w-24">Quality Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredResults.map((item, index) => {
                    const qualityPoints = (item.gradePoint * item.creditUnits).toFixed(1);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 text-center font-mono text-slate-400">{index + 1}</td>
                        <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{item.courseCode}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-700">{item.courseTitle}</td>
                        <td className="px-4 py-3.5 text-center font-bold font-mono text-slate-800">{item.creditUnits}</td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-600">{item.caScore}</td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-600">{item.examScore}</td>
                        <td className="px-4 py-3.5 text-center font-bold font-mono text-slate-900">{item.totalScore}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase border ${getGradeBadge(item.grade)}`}>
                            {item.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-600">{item.gradePoint.toFixed(1)}</td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900">{qualityPoints}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-xs">
                  <tr className="font-extrabold text-slate-900">
                    <td colSpan={3} className="px-5 py-4 text-right uppercase text-[10px] tracking-wider text-slate-500">
                      FILTERED SUMMARY ({selectedSession} &bull; {selectedSemester}):
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-sm text-[var(--color-poly-primary)]">
                      {selectedSemesterStats.totalUnits}
                    </td>
                    <td colSpan={5} className="px-4 py-4 text-right uppercase text-[10px] tracking-wider text-slate-500">
                      GPA:
                    </td>
                    <td className="px-4 py-4 text-center font-mono text-sm font-black text-emerald-700">
                      {selectedSemesterStats.gpa}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Polytechnic Ibadan Official Grading Scale Key Reference Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Info className="w-4 h-4 text-[var(--color-poly-primary)]" />
            <span>The Polytechnic, Ibadan Grading Scale & Classification Standard (4.00 System)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-9 gap-2 text-center text-[10px]">
            <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
              <span className="font-bold text-emerald-900 block">75 - 100%</span>
              <span className="font-extrabold text-emerald-700 text-sm block">A</span>
              <span className="text-slate-500">4.00 GP</span>
            </div>
            <div className="p-2 rounded bg-emerald-50/60 border border-emerald-200">
              <span className="font-bold text-emerald-900 block">70 - 74%</span>
              <span className="font-extrabold text-emerald-700 text-sm block">AB</span>
              <span className="text-slate-500">3.50 GP</span>
            </div>
            <div className="p-2 rounded bg-blue-50 border border-blue-200">
              <span className="font-bold text-blue-900 block">65 - 69%</span>
              <span className="font-extrabold text-blue-700 text-sm block">B</span>
              <span className="text-slate-500">3.00 GP</span>
            </div>
            <div className="p-2 rounded bg-blue-50/60 border border-blue-200">
              <span className="font-bold text-blue-900 block">60 - 64%</span>
              <span className="font-extrabold text-blue-700 text-sm block">BC</span>
              <span className="text-slate-500">2.50 GP</span>
            </div>
            <div className="p-2 rounded bg-teal-50 border border-teal-200">
              <span className="font-bold text-teal-900 block">55 - 59%</span>
              <span className="font-extrabold text-teal-700 text-sm block">C</span>
              <span className="text-slate-500">2.00 GP</span>
            </div>
            <div className="p-2 rounded bg-amber-50 border border-amber-200">
              <span className="font-bold text-amber-900 block">50 - 54%</span>
              <span className="font-extrabold text-amber-700 text-sm block">CD</span>
              <span className="text-slate-500">1.50 GP</span>
            </div>
            <div className="p-2 rounded bg-amber-50/60 border border-amber-200">
              <span className="font-bold text-amber-900 block">45 - 49%</span>
              <span className="font-extrabold text-amber-700 text-sm block">D</span>
              <span className="text-slate-500">1.00 GP</span>
            </div>
            <div className="p-2 rounded bg-amber-50/40 border border-amber-200">
              <span className="font-bold text-amber-900 block">40 - 44%</span>
              <span className="font-extrabold text-amber-700 text-sm block">E</span>
              <span className="text-slate-500">0.50 GP</span>
            </div>
            <div className="p-2 rounded bg-red-50 border border-red-200">
              <span className="font-bold text-red-900 block">0 - 39%</span>
              <span className="font-extrabold text-red-700 text-sm block">F</span>
              <span className="text-slate-500">0.00 GP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Statement Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Official Statement of Results Preview</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Statement
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-slate-50 font-serif">
              <div className="bg-white p-8 rounded-xl border border-slate-300 shadow-xs">
                <PrintableStatement 
                  studentName={studentName}
                  matricNumber={matricNumber}
                  studentLevel={studentLevel}
                  academicSession={selectedSession}
                  selectedSemester={selectedSemester}
                  results={filteredResults}
                  cumulativeStats={cumulativeStats}
                  selectedSemesterStats={selectedSemesterStats}
                  passportPhotoUrl={passportPhotoUrl}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

{/* Printable Official Statement Component */}
type PrintableStatementProps = {
  studentName: string;
  matricNumber: string;
  studentLevel: string;
  academicSession: string;
  selectedSemester: string;
  results: ResultItem[];
  cumulativeStats: {
    totalUnitsAttempted: number;
    totalUnitsPassed: number;
    totalQualityPoints: number;
    cgpa: string;
    diplomaClass: string;
  };
  selectedSemesterStats: {
    totalUnits: number;
    passedUnits: number;
    totalQualityPoints: number;
    gpa: string;
  };
  passportPhotoUrl?: string;
};

function PrintableStatement({
  studentName,
  matricNumber,
  studentLevel,
  academicSession,
  selectedSemester,
  results,
  cumulativeStats,
  selectedSemesterStats,
  passportPhotoUrl
}: PrintableStatementProps) {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div id="printable-statement-content" className="space-y-6 text-black bg-white p-2">
      {/* Official Institutional Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
        {/* Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full border-2 border-slate-900 p-1 flex items-center justify-center bg-emerald-950 text-amber-400 font-bold text-center shrink-0">
            <div className="text-[9px] leading-tight uppercase font-extrabold">
              TPI<br />1970
            </div>
          </div>
        </div>

        {/* Title Block */}
        <div className="text-center flex-1 px-4">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">
            THE POLYTECHNIC, IBADAN
          </h1>
          <h2 className="text-xs sm:text-sm font-bold uppercase text-slate-800 tracking-wider">
            FACULTY OF SCIENCE &bull; DEPARTMENT OF COMPUTER SCIENCE
          </h2>
          <div className="inline-block mt-2 bg-slate-900 text-white font-bold text-xs uppercase px-4 py-1 rounded">
            OFFICIAL STATEMENT OF ACADEMIC RESULTS
          </div>
        </div>

        {/* Passport Photo */}
        <div className="w-20 h-24 sm:w-24 sm:h-28 border-2 border-slate-900 flex flex-col items-center justify-center bg-slate-50 shrink-0 overflow-hidden text-center">
          {passportPhotoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={passportPhotoUrl} 
              alt="Passport" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="p-1 space-y-1 text-slate-400">
              <User className="w-8 h-8 mx-auto" />
              <span className="text-[8px] font-bold uppercase block text-slate-500 leading-tight">
                PASSPORT<br />PHOTO
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Student Metadata Table */}
      <div className="border border-slate-900 text-xs grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-slate-900">
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Student Full Name:</span>
          <span className="font-bold uppercase text-slate-900">{studentName}</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Matriculation No:</span>
          <span className="font-mono font-bold text-slate-900">{matricNumber}</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Programme / Option:</span>
          <span className="font-bold text-slate-900">Computer Science</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Academic Level:</span>
          <span className="font-bold text-slate-900">{studentLevel}</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Session Filter:</span>
          <span className="font-bold text-slate-900">{academicSession}</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Semester Filter:</span>
          <span className="font-bold text-slate-900">{selectedSemester} Semester</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Current CGPA:</span>
          <span className="font-bold text-slate-900">{cumulativeStats.cgpa} / 4.00</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Issue Date:</span>
          <span className="font-bold text-slate-900">{currentDate}</span>
        </div>
      </div>

      {/* Itemized Results Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          OFFICIAL COURSE GRADES & PERFORMANCE RECORD:
        </h4>

        <table className="w-full text-left text-xs border-collapse border border-slate-900">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-slate-900">
              <th className="py-2 px-2 border-r border-slate-900 text-center w-8">S/N</th>
              <th className="py-2 px-2 border-r border-slate-900 w-24">Course Code</th>
              <th className="py-2 px-2 border-r border-slate-900">Course Title</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center w-12">Units</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center w-12">CA</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center w-12">Exam</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center w-12">Total</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center w-12">Grade</th>
              <th className="py-2 px-2 text-center w-14">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {results.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-4 text-center text-slate-500 italic">
                  No registered result records found for this selection.
                </td>
              </tr>
            ) : (
              results.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-900">
                  <td className="py-1.5 px-2 text-center font-mono border-r border-slate-900">{index + 1}</td>
                  <td className="py-1.5 px-2 font-mono font-bold border-r border-slate-900">{item.courseCode}</td>
                  <td className="py-1.5 px-2 border-r border-slate-900">{item.courseTitle}</td>
                  <td className="py-1.5 px-2 text-center font-bold border-r border-slate-900">{item.creditUnits}</td>
                  <td className="py-1.5 px-2 text-center font-mono border-r border-slate-900">{item.caScore}</td>
                  <td className="py-1.5 px-2 text-center font-mono border-r border-slate-900">{item.examScore}</td>
                  <td className="py-1.5 px-2 text-center font-bold border-r border-slate-900">{item.totalScore}</td>
                  <td className="py-1.5 px-2 text-center font-bold border-r border-slate-900">{item.grade}</td>
                  <td className="py-1.5 px-2 text-center font-mono">{item.gradePoint.toFixed(1)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="font-extrabold border-t-2 border-slate-900 bg-slate-50 text-slate-900">
              <td colSpan={3} className="py-2 px-2 text-right border-r border-slate-900 uppercase">
                SEMESTER TOTALS:
              </td>
              <td className="py-2 px-2 text-center border-r border-slate-900 font-mono text-sm">{selectedSemesterStats.totalUnits}</td>
              <td colSpan={3} className="py-2 px-2 text-right border-r border-slate-900 uppercase">
                GPA:
              </td>
              <td colSpan={2} className="py-2 px-2 text-center font-mono text-sm">{selectedSemesterStats.gpa}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Cumulative Record Summary & Diploma Classification */}
      <div className="border border-slate-900 p-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-900">
        <div>
          <span>CUMULATIVE UNITS ATTEMPTED: <strong>{cumulativeStats.totalUnitsAttempted}</strong></span>
          <span className="ml-4">UNITS PASSED: <strong>{cumulativeStats.totalUnitsPassed}</strong></span>
        </div>
        <div>
          <span>CUMULATIVE GPA (CGPA): <strong className="text-base font-black ml-1">{cumulativeStats.cgpa}</strong></span>
          <span className="ml-4 uppercase bg-slate-900 text-white px-2 py-0.5 rounded text-[10px]">
            {cumulativeStats.diplomaClass}
          </span>
        </div>
      </div>

      {/* Endorsements & Signature Lines */}
      <div className="space-y-6 pt-2">
        <div className="p-2 border border-slate-900 text-[9px] bg-slate-50/50 leading-relaxed text-slate-800 italic">
          <strong>NOTE:</strong> This statement is issued directly from the Department of Computer Science portal and reflects official HOD & Senate approved academic records for {studentName} ({matricNumber}).
        </div>

        <div className="grid grid-cols-3 gap-6 pt-4 text-[10px]">
          <div className="text-center space-y-6">
            <div className="border-b border-slate-900 pb-1 font-bold h-8 flex items-end justify-center">
              <span className="font-serif italic text-slate-400">Signed</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">Dept. Exam Officer</p>
              <p className="text-[9px] text-slate-600">Computer Science Dept.</p>
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="border-b border-slate-900 pb-1 font-bold h-8 flex items-end justify-center">
              <span className="font-serif italic text-slate-400">Signed & Stamped</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">Head of Department</p>
              <p className="text-[9px] text-slate-600">HOD Computer Science</p>
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="border-b border-slate-900 pb-1 font-bold h-8 flex items-end justify-center">
              <span className="font-serif italic text-slate-400">Signed & Stamped</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">Dean, Faculty of Science</p>
              <p className="text-[9px] text-slate-600">The Polytechnic, Ibadan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode & Ref */}
      <div className="border-t-2 border-slate-900 pt-3 flex items-center justify-between text-[9px] text-slate-600">
        <div>
          <span className="font-mono font-bold text-slate-900 block">
            REF: TPI/CSC/SOR/{academicSession.replace('/', '-')}/{matricNumber.replace('/', '-')}
          </span>
          <span>Verified Document &bull; Generated via CS Academic Portal</span>
        </div>

        <div className="font-mono tracking-widest text-slate-900 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
          ||||| |||| ||| ||||| || |||
        </div>
      </div>
    </div>
  );
}
