import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ApproveResultsClient, { CourseSummary } from './ApproveResultsClient';

interface Props {
  searchParams: Promise<{ session?: string }>;
}

export default async function ApproveResultsPage({ searchParams }: Props) {
  const session = await getSession();

  if (!session || (session.role !== 'Staff' && session.role !== 'Admin')) {
    redirect('/login');
  }

  const { session: querySession } = await searchParams;
  const activeSession = querySession || '2024/2025';

  // Fetch all courses in department
  const courses = await prisma.course.findMany({
    include: {
      lecturer: {
        include: {
          user: true
        }
      },
      results: {
        where: {
          academicSession: activeSession
        }
      }
    },
    orderBy: {
      code: 'asc'
    }
  });

  // Transform into CourseSummary objects
  const courseSummaries: CourseSummary[] = courses.map((course) => {
    const results = course.results || [];
    const totalStudents = results.length;

    let approvedCount = 0;
    let pendingCount = 0;
    let totalScoreSum = 0;
    let passCount = 0;
    let failCount = 0;

    const gradeDist = {
      A: 0,
      AB: 0,
      B: 0,
      BC: 0,
      C: 0,
      CD: 0,
      D: 0,
      E: 0,
      F: 0
    };

    results.forEach((r) => {
      if (r.isApproved) approvedCount++;
      else pendingCount++;

      totalScoreSum += r.totalScore;

      if (r.totalScore >= 40) passCount++;
      else failCount++;

      // Increment grade distribution
      const g = (r.grade || 'F').toUpperCase() as keyof typeof gradeDist;
      if (g in gradeDist) {
        gradeDist[g]++;
      } else {
        gradeDist.F++;
      }
    });

    const avgScore = totalStudents > 0 ? Math.round(totalScoreSum / totalStudents) : 0;
    const isFullyApproved = totalStudents > 0 && pendingCount === 0 && approvedCount > 0;

    const lecturerName = course.lecturer
      ? `${course.lecturer.user.firstName} ${course.lecturer.user.lastName}`
      : 'Unassigned';

    const lecturerTitle = course.lecturer?.title || 'Lecturer';

    return {
      courseId: course.id,
      code: course.code,
      title: course.title,
      creditUnits: course.creditUnits,
      level: course.level,
      semester: course.semester,
      lecturerName,
      lecturerTitle,
      totalStudents,
      approvedCount,
      pendingCount,
      avgScore,
      passCount,
      failCount,
      isFullyApproved,
      gradeDistribution: gradeDist
    };
  });

  // Filter out courses that have no results submitted at all unless desired, or sort courses with pending results first
  const sortedSummaries = [...courseSummaries].sort((a, b) => {
    // Pending results first
    if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
    if (a.pendingCount === 0 && b.pendingCount > 0) return 1;
    return a.code.localeCompare(b.code);
  });

  return (
    <ApproveResultsClient 
      initialCourses={sortedSummaries} 
      academicSession={activeSession} 
    />
  );
}
