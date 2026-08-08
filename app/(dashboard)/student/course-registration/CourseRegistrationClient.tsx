/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { 
  Printer, 
  FileCheck, 
  Save, 
  Loader2, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Edit3, 
  Sparkles,
  BookOpen,
  Award,
  User,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { registerCourses } from './actions';

type Course = {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  level: string;
  semester: string;
  isElective: boolean;
};

type RegisteredCourse = {
  courseId: string;
  status: string;
  semester: string;
};

type Props = {
  availableCourses: Course[];
  registeredCourses: RegisteredCourse[];
  studentLevel: string;
  academicSession: string;
  studentName?: string;
  matricNumber?: string;
  passportPhotoUrl?: string;
};

export default function CourseRegistrationClient({ 
  availableCourses, 
  registeredCourses, 
  studentLevel, 
  academicSession, 
  studentName = 'Student', 
  matricNumber = 'N/A',
  passportPhotoUrl
}: Props) {
  const [activeSemester, setActiveSemester] = useState<string>('First');
  
  const initialSelected = useMemo(() => {
    return registeredCourses
      .filter(c => c.semester === activeSemester)
      .map(c => c.courseId);
  }, [registeredCourses, activeSemester]);

  const [selectedCourses, setSelectedCourses] = useState<string[]>(initialSelected);
  const [isSubmitted, setIsSubmitted] = useState(initialSelected.length > 0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Check registration status for current semester
  const currentSemesterRegistered = useMemo(() => {
    return registeredCourses.filter(c => c.semester === activeSemester);
  }, [registeredCourses, activeSemester]);

  const registrationStatus = useMemo(() => {
    if (currentSemesterRegistered.length === 0) return 'Not Registered';
    const isApproved = currentSemesterRegistered.some(c => c.status === 'APPROVED' || c.status === 'Approved');
    if (isApproved) return 'Approved';
    return 'Pending Approval';
  }, [currentSemesterRegistered]);

  // Reset selected courses and submission state when semester changes
  useEffect(() => {
    const semSelected = registeredCourses
      .filter(c => c.semester === activeSemester)
      .map(c => c.courseId);
    setSelectedCourses(semSelected);
    setIsSubmitted(semSelected.length > 0);
  }, [activeSemester, registeredCourses]);

  const displayedCourses = useMemo(() => {
    return availableCourses.filter(c => c.semester === activeSemester);
  }, [availableCourses, activeSemester]);

  const totalCredits = displayedCourses
    .filter(c => selectedCourses.includes(c.id))
    .reduce((sum, c) => sum + c.creditUnits, 0);

  const maxCredits = 24; // Standard max credit load per semester

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseId)) {
        return prev.filter(id => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  };

  const handlePrint = () => {
    toast.info('Preparing course form for printing...');
    
    // Attempt 1: Try printing in a dedicated clean pop-up window (bypasses iframe restrictions)
    const printElement = document.getElementById('printable-course-form-content');
    if (printElement) {
      try {
        const printWin = window.open('', '_blank', 'width=900,height=1000');
        if (printWin) {
          printWin.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Course Registration Form - ${studentName} (${matricNumber})</title>
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
        // Fallback to window.print() if popup open fails
      }
    }

    // Attempt 2: Fallback to direct window.print()
    try {
      window.focus();
      window.print();
    } catch {
      toast.error('Unable to trigger print dialog. Please try pressing Ctrl+P or Cmd+P.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (totalCredits === 0) {
      toast.error('Please select at least one course.');
      return;
    }

    if (totalCredits > maxCredits) {
      toast.error(`You cannot exceed the maximum of ${maxCredits} credit units.`);
      return;
    }
    
    startTransition(async () => {
      const res = await registerCourses(selectedCourses, activeSemester);
      if (res.success) {
        setIsSubmitted(true);
        toast.success('Course registration saved successfully!');
      } else {
        toast.error(res.error || 'Failed to save registration');
      }
    });
  };

  const registeredCourseDetails = displayedCourses.filter(c => selectedCourses.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Printable Area - Rendered when printing window.print() */}
      <div className="hidden print:block text-black bg-white p-6 font-serif">
        <PrintableCourseForm 
          studentName={studentName}
          matricNumber={matricNumber}
          studentLevel={studentLevel}
          academicSession={academicSession}
          activeSemester={activeSemester}
          registeredCourseDetails={registeredCourseDetails}
          totalCredits={totalCredits}
          passportPhotoUrl={passportPhotoUrl}
          registrationStatus={registrationStatus}
        />
      </div>

      {/* On-Screen Controls Header (Hidden in Print) */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[var(--color-poly-primary)] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                Department of Computer Science
              </span>
              {isSubmitted && (
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  registrationStatus === 'Approved' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {registrationStatus}
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-poly-text-heading)]">
              Course Registration & Course Form
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Student: <strong className="text-slate-700">{studentName}</strong> ({matricNumber}) &bull; Level: {studentLevel} &bull; Session: {academicSession}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSubmitted && registeredCourseDetails.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 border border-slate-200"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  Preview Form
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors inline-flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Course Form
                </button>
              </>
            )}

            <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Units:</span>
              <span className={`text-lg font-black ${totalCredits > maxCredits ? 'text-red-600' : 'text-[var(--color-poly-primary)]'}`}>
                {totalCredits} <span className="text-xs font-normal text-slate-400">/ {maxCredits}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Semester Selector Tabs */}
        <div className="bg-white p-1.5 rounded-xl border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
          <button
            onClick={() => setActiveSemester('First')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeSemester === 'First' 
                ? 'bg-[var(--color-poly-primary)] text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            First Semester
          </button>
          <button
            onClick={() => setActiveSemester('Second')}
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeSemester === 'Second' 
                ? 'bg-[var(--color-poly-primary)] text-white shadow-2xs' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Second Semester
          </button>
        </div>

        {/* Warning if credits exceeded */}
        {totalCredits > maxCredits && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            Warning: You have selected {totalCredits} credit units, which exceeds the maximum limit of {maxCredits} units. Please uncheck some courses before submitting.
          </div>
        )}

        {/* Main Content View: Registration Form vs Confirmation Screen */}
        {isSubmitted ? (
          <div className="space-y-6">
            {/* Registration Success Banner & Quick Action Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-2xs text-center max-w-3xl mx-auto space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <FileCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900">
                  Course Registration Submitted
                </h2>
                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Your course registration for the <strong className="text-slate-800">{activeSemester} Semester, {academicSession} Session</strong> is recorded. You have registered <strong className="text-slate-800">{registeredCourseDetails.length} courses</strong> ({totalCredits} Credit Units).
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handlePrint}
                  className="px-6 py-3 bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white text-xs font-extrabold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Course Form
                </button>

                <button
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 border border-slate-200"
                >
                  <Eye className="w-4 h-4 text-slate-600" />
                  Preview Form On-Screen
                </button>

                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 border border-slate-300"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  Modify Registration
                </button>
              </div>
            </div>

            {/* Embedded On-Screen Course Form Document Preview */}
            <div className="bg-white rounded-2xl border border-slate-300 p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-poly-primary)]" />
                  Official Course Form Preview ({activeSemester} Semester)
                </div>
                <button
                  onClick={handlePrint}
                  className="text-xs font-bold text-[var(--color-poly-primary)] hover:underline inline-flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Direct Print
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xs font-serif text-slate-900">
                <PrintableCourseForm 
                  studentName={studentName}
                  matricNumber={matricNumber}
                  studentLevel={studentLevel}
                  academicSession={academicSession}
                  activeSemester={activeSemester}
                  registeredCourseDetails={registeredCourseDetails}
                  totalCredits={totalCredits}
                  passportPhotoUrl={passportPhotoUrl}
                  registrationStatus={registrationStatus}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Editable Registration Form Table */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h2 className="text-sm font-extrabold text-[var(--color-poly-text-heading)]">
                  Select {activeSemester} Semester Courses ({studentLevel})
                </h2>
                <p className="text-xs text-slate-500">
                  Check all core and elective courses you are taking this semester.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                {displayedCourses.length} Available
              </span>
            </div>
            
            {displayedCourses.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No courses available for your level and semester.
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 w-16 text-center border-b border-slate-200">Select</th>
                      <th className="px-5 py-3 border-b border-slate-200">Course Code</th>
                      <th className="px-5 py-3 border-b border-slate-200">Course Title</th>
                      <th className="px-5 py-3 text-center border-b border-slate-200">Credit Units</th>
                      <th className="px-5 py-3 border-b border-slate-200">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {displayedCourses.map((course) => {
                      const isChecked = selectedCourses.includes(course.id);
                      return (
                        <tr 
                          key={course.id} 
                          onClick={() => handleToggleCourse(course.id)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            isChecked ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 text-[var(--color-poly-primary)] focus:ring-[var(--color-poly-primary)] cursor-pointer"
                              checked={isChecked}
                              onChange={() => handleToggleCourse(course.id)}
                            />
                          </td>
                          <td className="px-5 py-3.5 font-bold font-mono text-slate-900">{course.code}</td>
                          <td className="px-5 py-3.5 font-medium text-slate-700">{course.title}</td>
                          <td className="px-5 py-3.5 text-center font-bold font-mono text-slate-800">{course.creditUnits}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              course.isElective 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {course.isElective ? 'Elective' : 'Core'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-medium">
                Selected: <strong className="text-slate-800">{selectedCourses.length} courses</strong> ({totalCredits} units)
              </div>

              <button 
                type="submit" 
                disabled={totalCredits === 0 || totalCredits > maxCredits || displayedCourses.length === 0 || isPending}
                className="w-full sm:w-auto bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-2xs"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isPending ? 'Saving Course Registration...' : 'Save & Submit Course Registration'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Full Screen Printable Form Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Course Registration Form Preview</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Now
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
                <PrintableCourseForm 
                  studentName={studentName}
                  matricNumber={matricNumber}
                  studentLevel={studentLevel}
                  academicSession={academicSession}
                  activeSemester={activeSemester}
                  registeredCourseDetails={registeredCourseDetails}
                  totalCredits={totalCredits}
                  passportPhotoUrl={passportPhotoUrl}
                  registrationStatus={registrationStatus}
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
                Print Course Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

{/* Printable Course Form Component */}
type PrintableFormProps = {
  studentName: string;
  matricNumber: string;
  studentLevel: string;
  academicSession: string;
  activeSemester: string;
  registeredCourseDetails: Course[];
  totalCredits: number;
  passportPhotoUrl?: string;
  registrationStatus: string;
};

function PrintableCourseForm({
  studentName,
  matricNumber,
  studentLevel,
  academicSession,
  activeSemester,
  registeredCourseDetails,
  totalCredits,
  passportPhotoUrl,
  registrationStatus
}: PrintableFormProps) {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div id="printable-course-form-content" className="space-y-6 text-black bg-white p-2">
      {/* Official Header Banner */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
        {/* Left: Emblem/Logo */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full border-2 border-slate-900 p-1 flex items-center justify-center bg-emerald-950 text-amber-400 font-bold text-center shrink-0">
            <div className="text-[9px] leading-tight uppercase font-extrabold">
              TPI<br />1970
            </div>
          </div>
        </div>

        {/* Center: Institution Details */}
        <div className="text-center flex-1 px-4">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">
            THE POLYTECHNIC, IBADAN
          </h1>
          <h2 className="text-sm font-bold uppercase text-slate-800 tracking-wider">
            FACULTY OF SCIENCE
          </h2>
          <h3 className="text-xs sm:text-sm font-extrabold uppercase text-slate-900 mt-0.5">
            DEPARTMENT OF COMPUTER SCIENCE
          </h3>
          <div className="inline-block mt-2 bg-slate-900 text-white font-bold text-xs uppercase px-4 py-1 rounded">
            STUDENT COURSE REGISTRATION FORM
          </div>
        </div>

        {/* Right: Passport Photo Box */}
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

      {/* Student Academic Metadata Grid */}
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
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Department:</span>
          <span className="font-bold text-slate-900">Computer Science</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Academic Level:</span>
          <span className="font-bold text-slate-900">{studentLevel}</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Academic Session:</span>
          <span className="font-bold text-slate-900">{academicSession}</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Semester:</span>
          <span className="font-bold text-slate-900">{activeSemester} Semester</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Form Status:</span>
          <span className="font-bold text-slate-900 uppercase">{registrationStatus}</span>
        </div>
        <div className="p-2 space-y-0.5">
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Print Date:</span>
          <span className="font-bold text-slate-900">{currentDate}</span>
        </div>
      </div>

      {/* Registered Courses Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          REGISTERED COURSES & CREDIT UNITS:
        </h4>

        <table className="w-full text-left text-xs border-collapse border border-slate-900">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-slate-900">
              <th className="py-2 px-2 border-r border-slate-900 text-center w-10">S/N</th>
              <th className="py-2 px-2 border-r border-slate-900 w-28">Course Code</th>
              <th className="py-2 px-2 border-r border-slate-900">Course Title</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center w-20">Units</th>
              <th className="py-2 px-2 border-r border-slate-900 text-center w-24">Type</th>
              <th className="py-2 px-2 text-center w-28">Lecturer Sign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {registeredCourseDetails.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-500 italic">
                  No registered courses found for this semester.
                </td>
              </tr>
            ) : (
              registeredCourseDetails.map((course, index) => (
                <tr key={course.id} className="border-b border-slate-900">
                  <td className="py-2 px-2 text-center font-mono border-r border-slate-900">{index + 1}</td>
                  <td className="py-2 px-2 font-mono font-bold border-r border-slate-900">{course.code}</td>
                  <td className="py-2 px-2 border-r border-slate-900">{course.title}</td>
                  <td className="py-2 px-2 text-center font-bold border-r border-slate-900">{course.creditUnits}</td>
                  <td className="py-2 px-2 text-center border-r border-slate-900">{course.isElective ? 'Elective' : 'Core'}</td>
                  <td className="py-2 px-2 text-center text-slate-400 font-sans text-[10px]">________________</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="font-extrabold border-t-2 border-slate-900 bg-slate-50">
              <td colSpan={3} className="py-2 px-2 text-right border-r border-slate-900 uppercase">
                TOTAL REGISTERED UNITS:
              </td>
              <td className="py-2 px-2 text-center border-r border-slate-900 font-mono text-sm">{totalCredits}</td>
              <td colSpan={2} className="py-2 px-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Declaration & Signatures Section */}
      <div className="space-y-4 pt-2">
        <div className="p-3 border border-slate-900 text-[10px] bg-slate-50/50 leading-relaxed text-slate-800 italic">
          <strong>STUDENT DECLARATION:</strong> I hereby declare that the courses listed above are true and accurate representations of my registration for the {activeSemester} Semester ({academicSession}). I agree to abide by all examination rules and academic standards of The Polytechnic, Ibadan.
        </div>

        {/* 4 Official Signature Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-[10px]">
          <div className="text-center space-y-6">
            <div className="border-b border-slate-900 pb-1 font-bold h-8 flex items-end justify-center">
              <span className="font-serif italic text-slate-400">Signature</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">{studentName}</p>
              <p className="text-[9px] text-slate-600">Student&apos;s Signature & Date</p>
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="border-b border-slate-900 pb-1 font-bold h-8 flex items-end justify-center">
              <span className="font-serif italic text-slate-400">Signature & Stamp</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">Level Adviser</p>
              <p className="text-[9px] text-slate-600">Course Adviser&apos;s Sign & Date</p>
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="border-b border-slate-900 pb-1 font-bold h-8 flex items-end justify-center">
              <span className="font-serif italic text-slate-400">Signature & Stamp</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">HOD Computer Science</p>
              <p className="text-[9px] text-slate-600">Head of Dept&apos;s Sign & Date</p>
            </div>
          </div>

          <div className="text-center space-y-6">
            <div className="border-b border-slate-900 pb-1 font-bold h-8 flex items-end justify-center">
              <span className="font-serif italic text-slate-400">Signature & Stamp</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 uppercase">Dean of Faculty</p>
              <p className="text-[9px] text-slate-600">Dean&apos;s Signature & Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Official Security Barcode & Footer Disclaimer */}
      <div className="border-t-2 border-slate-900 pt-3 flex flex-col sm:flex-row items-center justify-between text-[9px] text-slate-600 gap-2">
        <div>
          <span className="font-mono font-bold text-slate-900 block">
            REF: TPI/CSC/CRF/{academicSession.replace('/', '-')}/{matricNumber.replace('/', '-')}
          </span>
          <span>Official Document of The Polytechnic, Ibadan &bull; Generated via CS Portal</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulated Barcode Visual */}
          <div className="font-mono tracking-widest text-slate-900 text-xs font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
            ||||| | |||| ||| |||| | ||
          </div>
        </div>
      </div>
    </div>
  );
}
