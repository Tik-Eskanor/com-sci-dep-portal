'use client';

import { useState, useTransition, useEffect, useMemo } from 'react';
import { 
  Megaphone, Plus, Trash2, Edit, Calendar, AlertTriangle, 
  Search, Filter, Users, X, Loader2, Save, Bell, CheckCircle2, 
  Sparkles, Clock, ShieldAlert, ArrowUpRight, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from './actions';
import { useRouter } from 'next/navigation';

type AnnouncementWithAuthor = {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  isUrgent: boolean;
  publishedAt: Date | string;
  author: {
    title: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

export default function AnnouncementsClient({
  initialAnnouncements
}: {
  initialAnnouncements: AnnouncementWithAuthor[];
}) {
  const [announcements, setAnnouncements] = useState<AnnouncementWithAuthor[]>(initialAnnouncements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ id: string; title: string } | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'URGENT' | 'NORMAL'>('ALL');

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'All Students & Staff',
    isUrgent: false
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      targetAudience: 'All Students & Staff',
      isUrgent: false
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: AnnouncementWithAuthor) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      targetAudience: item.targetAudience,
      isUrgent: item.isUrgent
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in both the title and content.');
      return;
    }

    startTransition(async () => {
      if (editingId) {
        toast.loading('Updating announcement...', { id: 'announcement-action' });
        const res = await updateAnnouncement(editingId, formData);
        if (res.success) {
          toast.success('Announcement updated successfully!', { id: 'announcement-action' });
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to update announcement.', { id: 'announcement-action' });
        }
      } else {
        toast.loading('Publishing announcement...', { id: 'announcement-action' });
        const res = await createAnnouncement(formData);
        if (res.success) {
          toast.success('Announcement published to portal & landing page!', { id: 'announcement-action' });
          setIsModalOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Failed to create announcement.', { id: 'announcement-action' });
        }
      }
    });
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    const target = deletingItem;

    startTransition(async () => {
      toast.loading('Deleting announcement...', { id: 'announcement-delete' });
      const res = await deleteAnnouncement(target.id);
      if (res.success) {
        toast.success(`Announcement '${target.title}' deleted successfully.`, { id: 'announcement-delete' });
        setAnnouncements(prev => prev.filter(a => a.id !== target.id));
        setDeletingItem(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete announcement.', { id: 'announcement-delete' });
      }
    });
  };

  // Filtered List
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(item => {
      const title = item.title.toLowerCase();
      const content = item.content.toLowerCase();
      const audience = item.targetAudience.toLowerCase();
      const authorName = `${item.author?.title || ''} ${item.author?.user?.firstName || ''} ${item.author?.user?.lastName || ''}`.toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesQuery = !q || title.includes(q) || content.includes(q) || audience.includes(q) || authorName.includes(q);
      const matchesAudience = audienceFilter === 'ALL' || item.targetAudience === audienceFilter;
      const matchesUrgency = urgencyFilter === 'ALL' 
        ? true 
        : urgencyFilter === 'URGENT' ? item.isUrgent : !item.isUrgent;

      return matchesQuery && matchesAudience && matchesUrgency;
    });
  }, [announcements, searchQuery, audienceFilter, urgencyFilter]);

  // Statistics
  const totalCount = announcements.length;
  const urgentCount = announcements.filter(a => a.isUrgent).length;
  const studentCount = announcements.filter(a => a.targetAudience.toLowerCase().includes('student') || a.targetAudience.toLowerCase().includes('all')).length;
  const staffCount = announcements.filter(a => a.targetAudience.toLowerCase().includes('staff')).length;

  const formatDate = (dateInput: Date | string) => {
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--color-poly-primary)] text-[var(--color-poly-secondary)] rounded-2xl shadow-xs shrink-0">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Department Announcements
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Publish news, urgent academic notices, and official directives to students and staff
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto bg-[var(--color-poly-primary)] hover:bg-[var(--color-poly-primary-light)] text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold transition-all shadow-xs hover:shadow-sm active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[var(--color-poly-secondary)] shrink-0" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Metrics Cards Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl shrink-0">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Notices</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent Bulletins</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{urgentCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Updates</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{studentCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Notices</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{staffCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements by title, keywords, or audience..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--color-poly-primary)] transition-all placeholder:text-slate-400 font-medium"
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

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Audiences</option>
              <option value="All Students & Staff">All Students & Staff</option>
              <option value="All Students">All Students</option>
              <option value="ND1">ND1</option>
              <option value="ND2">ND2</option>
              <option value="HND1">HND1</option>
              <option value="HND2">HND2</option>
              <option value="HND2 & ND2">HND2 & ND2</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => setUrgencyFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${urgencyFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All
            </button>
            <button
              onClick={() => setUrgencyFilter('URGENT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${urgencyFilter === 'URGENT' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-500 hover:text-red-600'}`}
            >
              Urgent
            </button>
            <button
              onClick={() => setUrgencyFilter('NORMAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${urgencyFilter === 'NORMAL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Normal
            </button>
          </div>

          {(searchQuery || audienceFilter !== 'ALL' || urgencyFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchQuery(''); setAudienceFilter('ALL'); setUrgencyFilter('ALL'); }}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Announcements List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnnouncements.map((item) => {
          const authorFullName = `${item.author?.title ? `${item.author.title} ` : ''}${item.author?.user?.firstName || 'HOD'} ${item.author?.user?.lastName || 'Office'}`.trim();

          return (
            <div 
              key={item.id}
              className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col overflow-hidden relative ${
                item.isUrgent ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200/90'
              }`}
            >
              {/* Urgent Top Bar */}
              {item.isUrgent ? (
                <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1 flex items-center gap-1.5 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Urgent Academic Bulletin</span>
                </div>
              ) : (
                <div className="h-1.5 bg-[var(--color-poly-primary)]" />
              )}

              {/* Card Header */}
              <div className="p-5 pb-3 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                    item.isUrgent 
                      ? 'bg-red-100 text-red-700 border border-red-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  }`}>
                    {item.targetAudience}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {formatDate(item.publishedAt)}
                  </span>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1 rounded-xl border border-slate-200/70">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-2xs text-xs font-bold"
                    title="Edit Announcement"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingItem({ id: item.id, title: item.title })}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-2xs text-xs font-bold"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug mb-2 hover:text-[var(--color-poly-primary)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-4">
                    {item.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="truncate">
                    Author: <strong className="text-slate-800 font-bold">{authorFullName}</strong>
                  </span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 uppercase">
                    Live
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredAnnouncements.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8 shadow-2xs">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {searchQuery || audienceFilter !== 'ALL' || urgencyFilter !== 'ALL' 
                ? 'No matching announcements found' 
                : 'No announcements published yet'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              {searchQuery || audienceFilter !== 'ALL' || urgencyFilter !== 'ALL'
                ? 'Try clearing your search query or reset active filters.'
                : 'Create your first departmental announcement to notify students and faculty.'}
            </p>
            {searchQuery || audienceFilter !== 'ALL' || urgencyFilter !== 'ALL' ? (
              <button
                onClick={() => { setSearchQuery(''); setAudienceFilter('ALL'); setUrgencyFilter('ALL'); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                Reset Search Filters
              </button>
            ) : (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-poly-primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-poly-primary-light)] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 text-[var(--color-poly-secondary)]" />
                New Announcement
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--color-poly-primary)] text-[var(--color-poly-secondary)] rounded-xl shadow-xs">
                  {editingId ? <Edit className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {editingId ? 'Edit Announcement' : 'Publish New Announcement'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingId ? 'Update announcement text and audience permissions' : 'Broadcast notice directly to landing page and student dashboards'}
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
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Submission of Course Registration Forms"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Audience
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium"
                >
                  <option value="All Students & Staff">All Students & Staff</option>
                  <option value="All Students">All Students</option>
                  <option value="ND1">ND1 Students</option>
                  <option value="ND2">ND2 Students</option>
                  <option value="HND1">HND1 Students</option>
                  <option value="HND2">HND2 Students</option>
                  <option value="HND2 & ND2">ND2 & HND2 (Final Year)</option>
                  <option value="Staff">Academic Staff</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Announcement Body / Content
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formData.content.length} characters
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Type the complete details of the announcement here..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-poly-primary)] text-sm font-medium leading-relaxed"
                />
              </div>

              {/* Priority Switch */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.isUrgent ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Mark as Urgent Bulletin</p>
                    <p className="text-[11px] text-slate-500">
                      Displays a bold red alert banner on the landing page and student portal.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isUrgent}
                    onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
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
                  <span>{isPending ? 'Publishing...' : editingId ? 'Update Notice' : 'Publish Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3.5 text-red-600 mb-4">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Delete Announcement</h3>
                <p className="text-xs text-slate-500 font-medium">This will remove the update immediately</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{deletingItem.title}</strong>? It will no longer appear on the landing page or student portals.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setDeletingItem(null)}
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
                <span>{isPending ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
