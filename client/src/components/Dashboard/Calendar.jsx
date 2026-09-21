import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common';

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar({ events = [] }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = new Date();
  const firstDay = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = useMemo(
    () =>
      Array.from(
        { length: Math.max(42, differenceInCalendarDays(lastDay, firstDay) + 1) },
        (_, index) => addDays(firstDay, index),
      ),
    [firstDay, lastDay],
  );
  const eventsByDate = useMemo(() => {
    const grouped = new Map();
    events.forEach((event) => {
      const dayEvents = grouped.get(event.date) || [];
      grouped.set(event.date, [...dayEvents, event]);
    });
    return grouped;
  }, [events]);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">일정 캘린더</h2>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
            onClick={() =>
              setMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))
            }
          >
            ‹ 이전
          </button>
          <strong>{format(month, 'yyyy년 M월')}</strong>
          <button
            type="button"
            className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
            onClick={() =>
              setMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))
            }
          >
            다음 ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-l border-t border-slate-200">
        {weekdays.map((weekday) => (
          <div
            key={weekday}
            className="border-b border-r border-slate-200 bg-slate-50 p-2 text-center text-xs font-medium text-slate-500"
          >
            {weekday}
          </div>
        ))}
        {days.map((day) => {
          const date = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate.get(date) || [];
          return (
            <div
              key={date}
              className={`min-h-24 border-b border-r border-slate-200 p-1.5 ${isSameMonth(day, month) ? 'bg-white' : 'bg-slate-50 text-slate-400'}`}
            >
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center text-xs ${isSameDay(day, today) ? 'rounded-full ring-2 ring-slate-900' : ''}`}
              >
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <Link
                    key={`${event.type}-${event.project_id}`}
                    to={`/projects/${event.project_id}`}
                    className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium ${event.type === 'start' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                    title={event.project_name}
                  >
                    {event.type === 'start' ? '시작' : '목표'} · {event.project_name}
                  </Link>
                ))}
                {dayEvents.length > 2 && (
                  <span className="block px-1 text-[10px] text-slate-500">
                    +{dayEvents.length - 2}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
