'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Search, Edit, Trash2, X, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { createStudent, updateStudent, deleteStudent } from './actions';

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  matricNumber: string;
  level: string;
  academicSession: string;
};

export default function ManageStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => 
      s.firstName.toLowerCase().includes(search.toLowerCase()) || 
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.matricNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Student];
        let bValue: any = b[sortConfig.key as keyof Student];

        if (sortConfig.key === 'name') {
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [students, search, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let res;
    if (editingStudent) {
      formData.append('id', editingStudent.id);
      res = await updateStudent(formData);
    } else {
      res = await createStudent(formData);
    }

    if (res.success) {
      toast.success(editingStudent ? 'Student updated successfully' : 'Student created successfully');
      setIsModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } else {
      toast.error(res.error || 'Operation failed');
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const res = await deleteStudent(deleteId);
    if (res.success) {
      toast.success('Student deleted successfully');
      setDeleteId(null);
      fetchStudents();
    } else {
      toast.error('Failed to delete student');
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-poly-text-heading)]">Manage Students</h1>
          <p className="text-sm text-slate-500 mt-1">Add, update, or remove students from the department</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white px-4 py-2 rounded-md font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, matric number, or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] focus:border-transparent"
            />
          </div>
          <div className="text-sm text-slate-500">
            Showing {filteredStudents.length} student{filteredStudents.length !== 1 && 's'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Student Name
                    {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                  </div>
                </th>
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => requestSort('matricNumber')}
                >
                  <div className="flex items-center gap-1">
                    Matric Number
                    {sortConfig?.key === 'matricNumber' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                  </div>
                </th>
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => requestSort('level')}
                >
                  <div className="flex items-center gap-1">
                    Level
                    {sortConfig?.key === 'level' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                  </div>
                </th>
                <th className="p-4 font-semibold">Contact Info</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <div className="animate-pulse flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-[var(--color-poly-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    No students found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{student.lastName}, {student.firstName}</div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.matricNumber}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      {student.level} <span className="text-slate-400 font-normal">({student.academicSession})</span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-600 text-xs">{student.email}</div>
                      {student.phone && <div className="text-slate-500 text-xs mt-1">{student.phone}</div>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(student)}
                          className="p-1.5 text-slate-400 hover:text-[var(--color-poly-primary)] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(student.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Student?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this student? All their results and data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-bold text-lg text-[var(--color-poly-primary)]">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input 
                    name="firstName" 
                    required 
                    defaultValue={editingStudent?.firstName}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[var(--color-poly-primary)] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input 
                    name="lastName" 
                    required 
                    defaultValue={editingStudent?.lastName}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[var(--color-poly-primary)] outline-none" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input 
                    name="email" 
                    type="email"
                    required 
                    defaultValue={editingStudent?.email}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[var(--color-poly-primary)] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input 
                    name="phone" 
                    defaultValue={editingStudent?.phone}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[var(--color-poly-primary)] outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Matric Number *</label>
                  <input 
                    name="matricNumber" 
                    required 
                    defaultValue={editingStudent?.matricNumber}
                    placeholder="e.g. CS/ND2/24/001"
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[var(--color-poly-primary)] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level *</label>
                  <select 
                    name="level" 
                    required 
                    defaultValue={editingStudent?.level || 'ND1'}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[var(--color-poly-primary)] outline-none"
                  >
                    <option value="ND1">ND1</option>
                    <option value="ND2">ND2</option>
                    <option value="HND1">HND1</option>
                    <option value="HND2">HND2</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Academic Session *</label>
                <input 
                  name="academicSession" 
                  required 
                  defaultValue={editingStudent?.academicSession || '2024/2025'}
                  placeholder="e.g. 2024/2025"
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[var(--color-poly-primary)] outline-none" 
                />
              </div>

              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editingStudent ? 'Reset Password (Optional)' : 'Initial Password *'}
                </label>
                <input 
                  name="password" 
                  type="password"
                  placeholder={editingStudent ? "Leave blank to keep unchanged" : "Default: password123"}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-[var(--color-poly-primary)] outline-none" 
                />
                {!editingStudent && (
                  <p className="text-xs text-slate-500 mt-1">If left blank, &quot;password123&quot; will be used.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[var(--color-poly-primary)] text-white rounded-md hover:bg-[var(--color-poly-primary-light)] text-sm font-medium transition-colors"
                >
                  {editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
