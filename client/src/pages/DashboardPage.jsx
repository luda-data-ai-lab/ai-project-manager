import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { PageHeader, Spinner } from '../components/common';
import ActiveProjects from '../components/Dashboard/ActiveProjects';
import NextTasks from '../components/Dashboard/NextTasks';
import BlockedTasks from '../components/Dashboard/BlockedTasks';
import RecentChanges from '../components/Dashboard/RecentChanges';
import DueSoon from '../components/Dashboard/DueSoon';
import Calendar from '../components/Dashboard/Calendar';
export default function DashboardPage() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((error) => toast.error(error.message));
  }, []);
  if (!data) return <Spinner />;
  return (
    <>
      <PageHeader title="대시보드" description="지금 바로 필요한 개발 현황을 확인하세요." />
      <div className="grid gap-5 lg:grid-cols-3">
        <ActiveProjects projects={data.active_projects} />
        <NextTasks tasks={data.next_tasks} />
        <BlockedTasks tasks={data.blocked_tasks} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <RecentChanges changes={data.recent_changes} />
        <DueSoon projects={data.due_soon} />
      </div>
      <div className="mt-5">
        <Calendar events={data.calendar} />
      </div>
    </>
  );
}
