import ReadingCalendar from '@/components/ReadingCalendar';

export default function ReadingCalendarSection() {
  return (
    <div className="section-container p-6 lg:p-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white tracking-tight">Reading Calendar</h2>
      </div>
      <ReadingCalendar />
    </div>
  );
} 