import ReadingCalendar from '@/components/ReadingCalendar';
import { CategorizedLink } from '@/types';

interface SummaryAndCalendarSectionProps {
  results: CategorizedLink[];
}

export default function SummaryAndCalendarSection({ results }: SummaryAndCalendarSectionProps) {
  return (
    <div className="space-y-10">
      {/* Summary Section */}
      <div className="section-container p-6 lg:p-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">Summary</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Active Days Card */}
          <div className="glass-card rounded-xl p-4 text-center relative overflow-hidden" style={{ cursor: 'default', pointerEvents: 'none' }}>
            <div className="text-2xl font-semibold text-white mb-1">
              {(() => {
                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                
                const monthDates = new Set();
                results.forEach(link => {
                  if (link.readAt) {
                    const readDate = new Date(link.readAt);
                    if (readDate >= monthStart && readDate <= monthEnd) {
                      monthDates.add(readDate.getDate());
                    }
                  }
                  if (link.createdAt) {
                    const createdDate = new Date(link.createdAt);
                    if (createdDate >= monthStart && createdDate <= monthEnd) {
                      monthDates.add(createdDate.getDate());
                    }
                  }
                });
                return monthDates.size;
              })()}
            </div>
            <div className="text-sm text-gray-300 font-medium">Active Days</div>
            <div className="text-xs text-gray-300 mt-1">This month</div>
          </div>
          
          {/* Total Links Card */}
          <div className="glass-card rounded-xl p-4 text-center relative overflow-hidden" style={{ cursor: 'default', pointerEvents: 'none' }}>
            <div className="text-2xl font-semibold text-white mb-1">
              {results.length}
            </div>
            <div className="text-sm text-gray-300 font-medium">Total Links</div>
            <div className="text-xs text-gray-300 mt-1">All time</div>
          </div>
          
          {/* Read Percentage Card */}
          <div className="glass-card rounded-xl p-4 text-center relative overflow-hidden" style={{ cursor: 'default', pointerEvents: 'none' }}>
            <div className="text-2xl font-semibold text-white mb-1">
              {results.length > 0 ? Math.round((results.filter(r => r.isRead).length / results.length) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-300 font-medium">Read Rate</div>
            <div className="text-xs text-gray-300 mt-1">Completion</div>
          </div>
        </div>
      </div>

      {/* Reading Calendar Section */}
      <div className="section-container p-6 lg:p-8">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white tracking-tight">Reading Calendar</h2>
        </div>
        <ReadingCalendar />
      </div>
    </div>
  );
} 