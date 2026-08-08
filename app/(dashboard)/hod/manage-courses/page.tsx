'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, X, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { createCourse, updateCourse, deleteCourse } from './actions';

type Course = {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  semester: string;
  level: string;
  category: string;
};

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      setCourses(data);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = useMemo(() => {
    let result = courses.filter(c => 
      c.code.toLowerCase().includes(search.toLowerCase()) || 
      c.title.toLowerCase().includes(search.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Course];
        let bValue: any = b[sortConfig.key as keyof Course];

        if (sortConfig.key === 'levelSem') {
          aValue = `${a.level}-${a.semester}`;
          bValue = `${b.level}-${b.semester}`;
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
  }, [courses, search, sortConfig]);

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
    if (editingCourse) {
      formData.append('id', editingCourse.id);
      res = await updateCourse(formData);
    } else {
      res = await createCourse(formData);
    }
      
    if (res.success) {
      toast.success(editingCourse ? 'Course updated successfully' : 'Course created successfully');
      setIsModalOpen(false);
      setEditingCourse(null);
      fetchCourses();
    } else {
      toast.error(res.error || 'Operation failed');
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const res = await deleteCourse(deleteId);
    if (res.success) {
      toast.success('Course deleted successfully');
      setDeleteId(null);
      fetchCourses();
    } else {
      toast.error('Failed to delete course');
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-poly-primary)]">Manage Courses</h1>
          <p className="text-sm text-slate-500">Add, edit, or remove departmental courses.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[var(--color-poly-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-poly-primary-light)] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add New Course
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => requestSort('code')}
                >
                  <div className="flex items-center gap-1">
                    Course Code
                    {sortConfig?.key === 'code' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                  </div>
                </th>
                <th className="p-4 font-semibold">Title</th>
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => requestSort('levelSem')}
                >
                  <div className="flex items-center gap-1">
                    Level & Sem
                    {sortConfig?.key === 'levelSem' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                  </div>
                </th>
                <th 
                  className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" 
                  onClick={() => requestSort('creditUnits')}
                >
                  <div className="flex items-center gap-1">
                    Units
                    {sortConfig?.key === 'creditUnits' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                  </div>
                </th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Loading courses...</td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">No courses found.</td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-[var(--color-poly-primary)]">{course.code}</td>
                    <td className="p-4 text-slate-700">{course.title}</td>
                    <td className="p-4">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {course.level} - {course.semester}
                      </span>
                    </td>
                    <td className="p-4">{course.creditUnits}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        course.category === 'E' ? 'bg-amber-100 text-amber-700' : 
                        course.category === 'C' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {course.category === 'E' ? 'Elective' : course.category === 'C' ? 'Core' : 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(course)}
                          className="p-1.5 text-slate-400 hover:text-[var(--color-poly-secondary)] transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(course.id)}
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Course?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this course? This action cannot be undone.
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-[var(--color-poly-primary)]">
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course Code</label>
                <input 
                  type="text" 
                  name="code" 
                  required 
                  defaultValue={editingCourse?.code || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  defaultValue={editingCourse?.title || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Credit Units</label>
                  <input 
                    type="number" 
                    name="creditUnits" 
                    min="1" 
                    max="6" 
                    required 
                    defaultValue={editingCourse?.creditUnits || 3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    name="category" 
                    defaultValue={editingCourse?.category || 'C'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                  >
                    <option value="C">Core (C)</option>
                    <option value="E">Elective (E)</option>
                    <option value="G">General (G)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                  <select 
                    name="level" 
                    defaultValue={editingCourse?.level || 'ND1'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                  >
                    <option value="ND1">ND1</option>
                    <option value="ND2">ND2</option>
                    <option value="HND1">HND1</option>
                    <option value="HND2">HND2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                  <select 
                    name="semester" 
                    defaultValue={editingCourse?.semester || 'First'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)]"
                  >
                    <option value="First">First</option>
                    <option value="Second">Second</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[var(--color-poly-primary)] text-white rounded-md hover:bg-[var(--color-poly-primary-light)] transition-colors text-sm font-medium"
                >
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
