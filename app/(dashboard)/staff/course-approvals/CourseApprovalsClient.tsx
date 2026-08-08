'use client';

import React, { useState, useTransition } from 'react';
import { updateCourseRegistrationStatus } from './actions';
import { toast } from 'sonner';
import { Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function CourseApprovalsClient({ initialRegistrations }: { initialRegistrations: any[] }) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleUpdateStatus = (regId: string, studentId: string, session: string, semester: string, status: string) => {
    startTransition(async () => {
      const res = await updateCourseRegistrationStatus(studentId, session, semester, status);
      if (res.success) {
        toast.success(`Course registration ${status.toLowerCase()} successfully.`);
        setRegistrations(prev => 
          prev.map(reg => reg.id === regId ? { ...reg, status } : reg)
        );
      } else {
        toast.error(res.error || 'Failed to update status');
      }
    });
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Session / Semester</th>
              <th className="px-6 py-4">Level</th>
              <th className="px-6 py-4">Courses / Units</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No course registrations found.
                </td>
              </tr>
            ) : (
              registrations.map(reg => (
                <React.Fragment key={reg.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{reg.studentName}</div>
                      <div className="text-xs text-slate-500">{reg.matricNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{reg.academicSession}</div>
                      <div className="text-xs text-slate-500">{reg.semester} Semester</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                        {reg.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{reg.courses.length} Courses</div>
                      <div className="text-xs text-slate-500">{reg.totalCredits} Units</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        reg.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        reg.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleExpanded(reg.id)}
                        className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                        title="View Details"
                      >
                        {expandedId === reg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      {reg.status !== 'Approved' && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, reg.studentId, reg.academicSession, reg.semester, 'Approved')}
                          disabled={isPending}
                          className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded transition-colors disabled:opacity-50"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      {reg.status !== 'Rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, reg.studentId, reg.academicSession, reg.semester, 'Rejected')}
                          disabled={isPending}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors disabled:opacity-50"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  
                  {expandedId === reg.id && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="bg-white p-4 rounded border border-slate-200">
                          <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Registered Courses</h4>
                          <table className="w-full text-xs">
                            <thead className="text-left border-b border-slate-100 text-slate-400">
                              <tr>
                                <th className="pb-2 font-medium">Code</th>
                                <th className="pb-2 font-medium">Title</th>
                                <th className="pb-2 font-medium text-center">Units</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {reg.courses.map((c: any) => (
                                <tr key={c.id}>
                                  <td className="py-2 font-medium text-slate-700">{c.course.code}</td>
                                  <td className="py-2 text-slate-600">{c.course.title}</td>
                                  <td className="py-2 text-center text-slate-600">{c.course.creditUnits}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
