'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { 
  Users, Plus, Trash2, Edit, Mail, Phone, BookOpen, Shield, X, 
  Loader2, Save, Clock, Search, Filter, GraduationCap, Copy, Check, 
  Briefcase, Award, Sparkles, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { addStaffMember, updateStaffMember, deleteStaffMember } from './actions';
import { useRouter } from 'next/navigation';

type Course = {
  id: string;
  code: string;
  title: string;
};

type StaffProfile = {
  id: string;
  staffId: string;
  title: string;
  specialization: string;
  officeHours: string;
  courses: Course[];
};

type UserModel = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  staffProfile: StaffProfile | null;
};

export default function ManageStaffClient({ 
  initialStaff, 
  courses 
}: { 
  initialStaff: UserModel[]; 
  courses: Course[]; 
}) {
  const [staffList, setStaffList] = useState<UserModel[]>(initialStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<{ id: string; name: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Admin' | 'Staff'>('ALL');

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setStaffList(initialStaff);
  }, [initialStaff]);

  const formatTitle = (title?: string | null) => {
    if (!title) return '';
    const clean = title.trim();
    if (clean === 'Dr.' || clean === 'Dr') return 'Dr.';
    if (clean === 'Prof.' || clean === 'Prof') return 'Prof.';
    if (clean === 'Mr.' || clean === 'Mr') return 'Mr.';
    if (clean === 'Mrs.' || clean === 'Mrs') return 'Mrs.';
    if (clean === 'Ms.' || clean === 'Ms') return 'Ms.';
    return clean;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    staffId: '',
    title: 'Mr.',
    specialization: '',
    officeHours: '',
    role: 'Staff' as 'Staff' | 'Admin',
    courseId: ''
  });

  const openAddModal = () => {
    setEditingUserId(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      staffId: '',
      title: 'Mr.',
      specialization: '',
      officeHours: '',
      role: 'Staff',
      courseId: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserModel) => {
    setEditingUserId(user.id);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      staffId: user.staffProfile?.staffId || '',
      title: user.staffProfile?.title || 'Mr.',
      specialization: user.staffProfile?.specialization || '',
      officeHours: user.staffProfile?.officeHours || '',
      role: user.role as 'Staff' | 'Admin',
      courseId: user.staffProfile?.courses?.[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      if (editingUserId) {
        const res = await updateStaffMember(editingUserId, formData);
        if (res.success) {
          toast.success('Staff profile updated successfully');
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to update staff profile');
        }
      } else {
        const res = await addStaffMember(formData);
        if (res.success) {
          toast.success('New staff member added successfully');
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to add staff member');
        }
      }
    });
  };

  const handleDelete = (userId: string, name: string) => {
    setDeletingStaff({ id: userId, name });
  };

  const confirmDelete = () => {
    if (!deletingStaff) return;
    const target = deletingStaff;
    startTransition(async () => {
      const res = await deleteStaffMember(target.id);
      if (res.success) {
        toast.success(`Staff member '${target.name}' removed successfully`);
        setStaffList(prev => prev.filter(s => s.id !== target.id));
        setDeletingStaff(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete staff member');
      }
    });
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const title = formatTitle(staff.staffProfile?.title);
      const fullName = `${title} ${staff.firstName} ${staff.lastName}`.toLowerCase();
      const staffId = (staff.staffProfile?.staffId || '').toLowerCase();
      const email = staff.email.toLowerCase();
      const spec = (staff.staffProfile?.specialization || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || fullName.includes(query) || staffId.includes(query) || email.includes(query) || spec.includes(query);
      const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, roleFilter]);

  // Statistics
  const totalStaffCount = staffList.length;
  const adminCount = staffList.filter(s => s.role === 'Admin').length;
  const lecturerCount = staffList.filter(s => s.role === 'Staff').length;
  const totalAssignedCourses = staffList.reduce((acc, curr) => acc + (curr.staffProfile?.courses?.length || 0), 0);

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName[0].toUpperCase() : '';
    const l = lastName ? lastName[0].toUpperCase() : '';
    return `${f}${l}` || 'CS';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 bg-[var(--color-poly-primary)] text-[var(--color-poly-secondary)] rounded-xl shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Staff Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Department of Computer Science &bull; Academic & Administrative Personnel
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={openAddModal}
          className="w-full md:w-auto bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white px-5 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2.5 text-sm"
        >
          <Plus className="w-5 h-5 text-[var(--color-poly-secondary)]" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{totalStaffCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">HOD / Admins</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{adminCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Staff</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{lecturerCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Courses</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{totalAssignedCourses}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, ID, email or specialization..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--color-poly-primary)] transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'Admin' | 'Staff')}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Roles ({staffList.length})</option>
              <option value="Admin">Admin / HOD ({adminCount})</option>
              <option value="Staff">Lecturers ({lecturerCount})</option>
            </select>
          </div>

          {(searchQuery || roleFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); }}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((staff) => {
          const formattedTitle = formatTitle(staff.staffProfile?.title);
          const fullName = `${formattedTitle ? `${formattedTitle} ` : ''}${staff.firstName} ${staff.lastName}`.trim();
          const initials = getInitials(staff.firstName, staff.lastName);
          const isAdmin = staff.role === 'Admin';

          return (
            <div 
              key={staff.id} 
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group min-w-0 relative"
            >
              {/* Top Accent Strip */}
              <div className={`h-2.5 w-full ${isAdmin ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500' : 'bg-gradient-to-r from-[var(--color-poly-primary)] to-slate-700'}`} />

              {/* Card Header */}
              <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Staff Avatar */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-xs ${
                    isAdmin 
                      ? 'bg-gradient-to-br from-amber-600 to-amber-800 ring-2 ring-amber-200' 
                      : 'bg-gradient-to-br from-slate-800 to-slate-900 ring-2 ring-slate-100'
                  }`}>
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug truncate group-hover:text-[var(--color-poly-primary)] transition-colors" title={fullName}>
                      {fullName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        isAdmin 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200/80' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      }`}>
                        {isAdmin ? <Shield className="w-3 h-3 text-amber-600" /> : <GraduationCap className="w-3 h-3 text-blue-600" />}
                        {isAdmin ? 'HOD / Admin' : 'Lecturer'}
                      </span>

                      {staff.staffProfile?.staffId && (
                        <button
                          onClick={() => handleCopy(staff.staffProfile!.staffId, 'Staff ID')}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md border border-slate-200/80 transition-colors"
                          title="Click to copy Staff ID"
                        >
                          {staff.staffProfile.staffId}
                          {copiedText === staff.staffProfile.staffId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200/70">
                  <button 
                    onClick={() => openEditModal(staff)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-2xs text-xs font-bold flex items-center gap-1"
                    title="Edit Staff Member"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="sr-only sm:not-sr-only text-[11px]">Edit</span>
                  </button>

                  <button 
                    onClick={() => handleDelete(staff.id, fullName)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-2xs text-xs font-bold flex items-center gap-1"
                    title="Remove Staff Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sr-only sm:not-sr-only text-[11px]">Delete</span>
                  </button>
                </div>
              </div>

              {/* Card Details Body */}
              <div className="p-5 space-y-3 flex-1 min-w-0 bg-white">
                {/* Specialization */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 min-w-0">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg shrink-0 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Specialization</p>
                    <p className="font-semibold text-slate-800 truncate">
                      {staff.staffProfile?.specialization || 'General Computer Science'}
                    </p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 min-w-0">
                  <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg shrink-0 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Address</p>
                    <a 
                      href={`mailto:${staff.email}`} 
                      className="font-medium text-slate-800 hover:text-[var(--color-poly-primary)] hover:underline transition-colors truncate block"
                    >
                      {staff.email}
                    </a>
                  </div>
                </div>

                {/* Phone Number */}
                {staff.phone && (
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 min-w-0">
                    <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg shrink-0 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Phone</p>
                      <a 
                        href={`tel:${staff.phone}`} 
                        className="font-medium text-slate-800 hover:text-[var(--color-poly-primary)] transition-colors truncate block"
                      >
                        {staff.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Office Hours */}
                {staff.staffProfile?.officeHours && (
                  <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 min-w-0 pt-2 border-t border-slate-100">
                    <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase text-amber-700/80 tracking-wider">Office Hours</p>
                      <p className="font-semibold text-slate-800 truncate">
                        {staff.staffProfile.officeHours}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Assigned Courses */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 mt-auto">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned Courses</span>
                  </div>
                  <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                    {staff.staffProfile?.courses?.length || 0}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {staff.staffProfile?.courses && staff.staffProfile.courses.length > 0 ? (
                    staff.staffProfile.courses.map((c) => (
                      <span 
                        key={c.id} 
                        className="bg-white border border-slate-200/90 text-slate-800 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold shadow-2xs flex items-center gap-1"
                        title={c.title}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {c.code}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-xs py-0.5">No courses assigned yet</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredStaff.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 shadow-2xs">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {searchQuery || roleFilter !== 'ALL' ? 'No matching staff members' : 'No staff members registered'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {searchQuery || roleFilter !== 'ALL'
                ? 'Try adjusting your search keywords or active filters to find what you are looking for.'
                : 'Get started by adding staff members, assigning courses, and setting up specializations.'}
            </p>
            {searchQuery || roleFilter !== 'ALL' ? (
              <button
                onClick={() => { setSearchQuery(''); setRoleFilter('ALL'); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                Reset Search & Filters
              </button>
            ) : (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-poly-primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-poly-primary-light)] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 text-[var(--color-poly-secondary)]" />
                Add Staff Member
              </button>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--color-poly-primary)] text-[var(--color-poly-secondary)] rounded-xl shadow-xs">
                  {editingUserId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {editingUserId ? 'Edit Staff Profile' : 'Add New Staff Member'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingUserId ? 'Update personnel details, specialization, and role' : 'Register a new lecturer or administrative staff member'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors p-2 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Title</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  >
                    <option value="Mr.">Mister (Mr.)</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Doctor">Doctor (Dr.)</option>
                    <option value="Professor">Professor (Prof.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Staff ID</label>
                  <input
                    type="text"
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({...formData, staffId: e.target.value})}
                    placeholder="e.g. CS/STAFF/001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="e.g. John"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="e.g. Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. staff@polyibadan.edu.ng"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. +234 800 000 0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Specialization Field</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    placeholder="e.g. Artificial Intelligence, Software Engineering, Networks"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Office Hours Schedule</label>
                  <input
                    type="text"
                    value={formData.officeHours}
                    onChange={(e) => setFormData({...formData, officeHours: e.target.value})}
                    placeholder="e.g. Mon & Wed 10:00 AM - 12:00 PM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'Staff' | 'Admin'})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  >
                    <option value="Staff">Academic Staff (Lecturer)</option>
                    <option value="Admin">HOD / Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assign Primary Course</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                  >
                    <option value="">-- No Course Selected --</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {!editingUserId && (
                <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl flex items-center gap-2.5 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Initial login password for new staff account is set to <strong>password123</strong>.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[var(--color-poly-primary)] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[var(--color-poly-primary-light)] transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[var(--color-poly-secondary)]" />}
                  <span>{isPending ? 'Saving...' : editingUserId ? 'Save Changes' : 'Create Staff Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Remove Staff Member</h3>
                <p className="text-xs text-slate-500 font-medium">This action will revoke portal credentials</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{deletingStaff.name}</strong>? Their assigned courses and portal account will be permanently unlinked.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmDelete}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isPending ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
