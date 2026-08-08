import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getAnnouncements } from './actions';
import AnnouncementsClient from './AnnouncementsClient';

export default async function HODAnnouncementsPage() {
  const session = await getSession();

  if (!session || (session.role !== 'Admin' && session.role !== 'Staff')) {
    redirect('/login');
  }

  const { announcements } = await getAnnouncements();

  return <AnnouncementsClient initialAnnouncements={announcements || []} />;
}
