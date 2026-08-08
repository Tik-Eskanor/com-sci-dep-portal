'use client';

import { useState, useTransition, useEffect } from 'react';
import { Users, Plus, Trash2, Edit, Mail, Phone, BookOpen, User, Shield, X, Loader2, Save, Clock } from 'lucide-react';
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

export default function ManageStaffClient({ initialStaff, courses }: { initialStaff: UserModel[], courses: Course[] }) {
  const [staffList, setStaffList] = useState<UserModel[]>(initialStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<{ id: string; name: string } | null>(null);
  
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStaffList(initialStaff);
  }, [initialStaff]);

  const formatTitle = (title?: string | null) => {
    if (!title) return '';
    const clean = title.trim();
    if (clean === 'Dr.' || clean === 'Dr') return 'Doctor';
    if (clean === 'Prof.' || clean === 'Prof') return 'Professor';
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
          toast.success('Staff member updated successfully.');
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to update staff member');
        }
      } else {
        const res = await addStaffMember(formData);
        if (res.success) {
          toast.success('Staff member added successfully.');
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
        toast.success(`Staff member '${target.name}' removed successfully.`);
        setStaffList(prev => prev.filter(s => s.id !== target.id));
        setDeletingStaff(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete staff member');
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-poly-text-heading)] mb-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--color-poly-primary)]" />
            Manage Staff
          </h1>
          <p className="text-sm text-slate-500">Add, remove, or update department staff members and details.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="w-full sm:w-auto bg-[var(--color-poly-primary)] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-[var(--color-poly-primary-light)] transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {staffList.map((staff) => {
          const displayTitle = formatTitle(staff.staffProfile?.title);
          const fullName = `${displayTitle ? `${displayTitle} ` : ''}${staff.firstName} ${staff.lastName}`.trim();

          return (
            <div key={staff.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-shadow hover:shadow-md min-w-0">
              {/* Card Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex flex-col min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 leading-snug text-base sm:text-lg break-words">
                    {fullName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      staff.role === 'Admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {staff.role}
                    </span>
                    <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {staff.staffProfile?.staffId || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 mt-2 sm:mt-0">
                  <button 
                    onClick={() => openEditModal(staff)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Edit Staff"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline sm:hidden lg:inline">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(staff.id, fullName)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Remove Staff"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline sm:hidden lg:inline">Delete</span>
                  </button>
                </div>
              </div>
              
              {/* Card Details Body */}
              <div className="p-4 sm:p-5 space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3 text-sm text-slate-600 min-w-0">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium truncate">{staff.staffProfile?.specialization || 'General Computer Science'}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-slate-600 min-w-0">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`mailto:${staff.email}`} className="hover:text-[var(--color-poly-secondary)] transition-colors truncate break-all">{staff.email}</a>
                </div>

                {staff.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 min-w-0">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={`tel:${staff.phone}`} className="hover:text-[var(--color-poly-secondary)] transition-colors truncate">{staff.phone}</a>
                  </div>
                )}

                {staff.staffProfile?.officeHours && (
                  <div className="flex items-center gap-3 text-xs text-slate-500 min-w-0 pt-1 border-t border-slate-50">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.staffProfile.officeHours}</span>
                  </div>
                )}
              </div>
              
              {/* Card Footer: Assigned Courses */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100">
                 <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                   <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                   Assigned Courses
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                   {staff.staffProfile?.courses && staff.staffProfile.courses.length > 0 ? (
                     staff.staffProfile.courses.map(c => (
                       <span key={c.id} className="bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] font-semibold text-slate-700 shadow-2xs">{c.code}</span>
                     ))
                   ) : (
                     <span className="text-slate-400 italic text-xs">No courses assigned</span>
                   )}
                 </div>
              </div>
            </div>
          );
        })}

        {staffList.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
             No staff members found.
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-[var(--color-poly-text-heading)]">
                {editingUserId ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Title</label>
                  <select
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  >
                    <option value="Mr.">Mister (Mr.)</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Staff ID</label>
                  <input
                    type="text"
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({...formData, staffId: e.target.value})}
                    placeholder="e.g. CS/STAFF/001"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="e.g. John"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="e.g. Doe"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="e.g. staff@polyibadan.edu.ng"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. +234 800 000 0000"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    placeholder="e.g. Artificial Intelligence, Software Engineering"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Office Hours</label>
                  <input
                    type="text"
                    value={formData.officeHours}
                    onChange={(e) => setFormData({...formData, officeHours: e.target.value})}
                    placeholder="e.g. Mon & Wed 10AM - 12PM"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'Staff' | 'Admin'})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  >
                    <option value="Staff">Regular Staff</option>
                    <option value="Admin">HOD / Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Assign Course (Optional)</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm"
                  >
                    <option value="">-- No Course --</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-[var(--color-poly-primary)] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[var(--color-poly-primary-light)] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm text-sm"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isPending ? 'Saving...' : editingUserId ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
              {!editingUserId && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Note: The default password for new accounts is <strong>password123</strong>.
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Remove Staff Member</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove <strong className="text-slate-900">{deletingStaff.name}</strong>? Their course assignments and portal account will be removed.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isPending ? 'Removing...' : 'Remove Staff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
