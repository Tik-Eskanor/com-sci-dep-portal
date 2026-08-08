'use client';

import { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  BookOpen, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  X, 
  Eye, 
  GraduationCap, 
  User, 
  LayoutGrid, 
  List,
  Sparkles
} from 'lucide-react';

export type EnrolledCourseInfo = {
  registrationId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  status: string;
  semester: string;
  academicSession: string;
};

export type StudentItem = {
  id: string;
  userId: string;
  matricNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  level: string;
  academicSession: string;
  passportPhotoUrl: string | null;
  courses: EnrolledCourseInfo[];
};

export type CourseOption = {
  id: string;
  code: string;
  title: string;
  level: string;
};

interface StaffStudentsClientProps {
  students: StudentItem[];
  assignedCourses: CourseOption[];
  isDepartmentRosterFallback?: boolean;
}

export default function StaffStudentsClient({
  students,
  assignedCourses,
  isDepartmentRosterFallback = false
}: StaffStudentsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  // Filtered Students logic
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Search query (Name, Matric, Email)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(q) ||
        student.matricNumber.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q);

      // Course filter
      const matchesCourse =
        selectedCourse === 'ALL' ||
        student.courses.some((c) => c.courseCode === selectedCourse || c.courseId === selectedCourse);

      // Level filter
      const matchesLevel =
        selectedLevel === 'ALL' || student.level === selectedLevel;

      // Status filter
      const matchesStatus =
        selectedStatus === 'ALL' ||
        student.courses.some((c) => c.status.toUpperCase() === selectedStatus.toUpperCase());

      return matchesSearch && matchesCourse && matchesLevel && matchesStatus;
    });
  }, [students, searchQuery, selectedCourse, selectedLevel, selectedStatus]);

  // Overall statistics
  const stats = useMemo(() => {
    let totalRegs = 0;
    let approvedRegs = 0;
    let pendingRegs = 0;

    students.forEach((s) => {
      s.courses.forEach((c) => {
        totalRegs++;
        if (c.status.toUpperCase() === 'APPROVED') approvedRegs++;
        if (c.status.toUpperCase() === 'PENDING') pendingRegs++;
      });
    });

    return {
      totalStudents: students.length,
      assignedCoursesCount: assignedCourses.length,
      totalRegistrations: totalRegs,
      approvedRegistrations: approvedRegs,
      pendingRegistrations: pendingRegs,
    };
  }, [students, assignedCourses]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCourse('ALL');
    setSelectedLevel('ALL');
    setSelectedStatus('ALL');
  };

  const getStatusBadge = (status: string) => {
    const uppercaseStatus = status.toUpperCase();
    if (uppercaseStatus === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Approved
        </span>
      );
    }
    if (uppercaseStatus === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        Pending
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-poly-text-heading)] flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--color-poly-primary)]" />
            My Students
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isDepartmentRosterFallback
              ? 'Showing department student roster.'
              : 'Students enrolled in your assigned departmental courses.'}
          </p>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden xs:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden xs:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Enrolled Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Assigned Courses</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.assignedCoursesCount}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Regs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.approvedRegistrations}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Regs</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.pendingRegistrations}</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student or matric..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
            />
          </div>

          {/* Filter Course */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
            >
              <option value="ALL">All Courses</option>
              {assignedCourses.map((course) => (
                <option key={course.id} value={course.code}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Level */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
            >
              <option value="ALL">All Levels</option>
              <option value="ND1">ND1</option>
              <option value="ND2">ND2</option>
              <option value="HND1">HND1</option>
              <option value="HND2">HND2</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
            >
              <option value="ALL">All Reg. Statuses</option>
              <option value="APPROVED">Approved Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Active filter count & reset */}
        {(searchQuery || selectedCourse !== 'ALL' || selectedLevel !== 'ALL' || selectedStatus !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing <strong>{filteredStudents.length}</strong> of {students.length} students
            </span>
            <button
              onClick={resetFilters}
              className="text-[var(--color-poly-primary)] hover:underline font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200 p-8 sm:p-12 text-center">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No students found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            {searchQuery || selectedCourse !== 'ALL' || selectedLevel !== 'ALL' || selectedStatus !== 'ALL'
              ? 'No students match your selected search or filter options.'
              : 'There are currently no students registered in your assigned courses.'}
          </p>
          {(searchQuery || selectedCourse !== 'ALL' || selectedLevel !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-bold">Student</th>
                  <th className="py-3 px-4 font-bold">Matric No.</th>
                  <th className="py-3 px-4 font-bold">Level</th>
                  <th className="py-3 px-4 font-bold">Enrolled Courses</th>
                  <th className="py-3 px-4 font-bold">Contact</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--color-poly-primary)] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-xs text-slate-400 font-mono sm:hidden">{student.matricNumber}</div>
                        </div>
                      </div>
                    </td>

                    {/* Matric Number */}
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                      {student.matricNumber}
                    </td>

                    {/* Level Badge */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {student.level}
                      </span>
                    </td>

                    {/* Enrolled Courses Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {student.courses.length > 0 ? (
                          student.courses.map((c) => (
                            <span
                              key={c.registrationId}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] font-semibold text-slate-700 shadow-2xs"
                              title={`${c.courseTitle} (${c.status})`}
                            >
                              {c.courseCode}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No courses registered</span>
                        )}
                      </div>
                    </td>

                    {/* Contact Links */}
                    <td className="py-3.5 px-4 text-xs space-y-1">
                      <a
                        href={`mailto:${student.email}`}
                        className="text-slate-600 hover:text-[var(--color-poly-primary)] flex items-center gap-1.5 truncate max-w-[180px]"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </a>
                      {student.phone && (
                        <a
                          href={`tel:${student.phone}`}
                          className="text-slate-600 hover:text-[var(--color-poly-primary)] flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{student.phone}</span>
                        </a>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-[var(--color-poly-primary)] hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 border border-slate-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-poly-primary)] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-snug">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-xs font-mono text-slate-500">{student.matricNumber}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                    {student.level}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 mb-4 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${student.email}`} className="hover:text-[var(--color-poly-primary)] truncate">
                      {student.email}
                    </a>
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${student.phone}`} className="hover:text-[var(--color-poly-primary)]">
                        {student.phone}
                      </a>
                    </div>
                  )}
                </div>

                {/* Enrolled Courses */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Courses ({student.courses.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {student.courses.length > 0 ? (
                      student.courses.map((c) => (
                        <span
                          key={c.registrationId}
                          className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] font-semibold text-slate-700 shadow-2xs"
                        >
                          {c.courseCode}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No courses registered</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(student)}
                className="w-full py-2 bg-slate-100 hover:bg-[var(--color-poly-primary)] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <Eye className="w-4 h-4" />
                View Full Profile
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-poly-primary)] text-white font-bold text-base flex items-center justify-center shadow-2xs">
                  {selectedStudent.firstName[0]}
                  {selectedStudent.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-xs font-mono text-slate-500">{selectedStudent.matricNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 text-sm">
              {/* Bio Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Level & Session
                  </span>
                  <div className="font-bold text-slate-800 text-sm">
                    {selectedStudent.level} ({selectedStudent.academicSession})
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Department
                  </span>
                  <div className="font-bold text-slate-800 text-sm">Computer Science</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Email Address
                  </span>
                  <a
                    href={`mailto:${selectedStudent.email}`}
                    className="text-[var(--color-poly-primary)] hover:underline text-xs font-semibold truncate block"
                  >
                    {selectedStudent.email}
                  </a>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Phone Number
                  </span>
                  <div className="text-xs font-semibold text-slate-700">
                    {selectedStudent.phone || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Registered Courses in Lecturer's Domain */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--color-poly-primary)]" />
                  Registered Courses ({selectedStudent.courses.length})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedStudent.courses.length > 0 ? (
                    selectedStudent.courses.map((course) => (
                      <div
                        key={course.registrationId}
                        className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div>
                          <div className="font-bold font-mono text-slate-900">{course.courseCode}</div>
                          <div className="text-slate-600 text-[11px]">{course.courseTitle}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">
                            {course.semester} Semester • {course.academicSession}
                          </div>
                        </div>
                        <div className="shrink-0">{getStatusBadge(course.status)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg text-center">
                      No course registrations recorded.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${selectedStudent.email}`}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  Email Student
                </a>
                {selectedStudent.phone && (
                  <a
                    href={`tel:${selectedStudent.phone}`}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    Call
                  </a>
                )}
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-1.5 bg-[var(--color-poly-primary)] text-white font-semibold text-xs rounded-lg hover:bg-[var(--color-poly-primary-light)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
