'use client';

import { useState, useEffect } from 'react';
import { CategorizedLink } from '@/types';
import { storage } from '@/lib/storage';

export default function ReadingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [readLinksForDate, setReadLinksForDate] = useState<CategorizedLink[]>([]);
  const [monthReadLinks, setMonthReadLinks] = useState<Map<string, CategorizedLink[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Get the first and last day of the current month
  const getMonthBounds = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  // Load read links for the current month
  useEffect(() => {
    const loadMonthData = async () => {
      setIsLoading(true);
      try {
        const { firstDay, lastDay } = getMonthBounds(currentDate);
        const links = await storage.getReadLinksByDateRange(firstDay, lastDay);
        
        // Group links by date
        const linksByDate = new Map<string, CategorizedLink[]>();
        links.forEach(link => {
          if (link.readAt) {
            const dateKey = link.readAt.toDateString();
            if (!linksByDate.has(dateKey)) {
              linksByDate.set(dateKey, []);
            }
            linksByDate.get(dateKey)!.push(link);
          }
        });
        
        setMonthReadLinks(linksByDate);
      } catch (error) {
        console.error('Error loading month data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthData();
  }, [currentDate]);

  // Load links for selected date
  useEffect(() => {
    if (selectedDate) {
      const loadDateLinks = async () => {
        try {
          const links = await storage.getReadLinksByDate(selectedDate);
          setReadLinksForDate(links);
        } catch (error) {
          console.error('Error loading date links:', error);
        }
      };
      loadDateLinks();
    }
  }, [selectedDate]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toDateString();
      const hasReadLinks = monthReadLinks.has(dateKey);
      const readCount = monthReadLinks.get(dateKey)?.length || 0;
      
      days.push({
        date,
        day,
        hasReadLinks,
        readCount,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: selectedDate?.toDateString() === date.toDateString()
      });
    }

    return days;
  };

  const monthNames = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="space-y-6">
      {/* Statistics - 맨 위로 이동 */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900">
            📊 {monthNames[currentDate.getMonth()]} 통계
          </h3>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600"></div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-slate-900">{monthReadLinks.size}</div>
            <div className="text-sm text-slate-600">활동 일수</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-700">
              {Array.from(monthReadLinks.values()).reduce((total, links) => total + links.length, 0)}
            </div>
            <div className="text-sm text-slate-600">읽은 콘텐츠</div>
          </div>
        </div>
      </div>

      {/* Compact Calendar */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg overflow-hidden">
        {/* Simple Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
          <button
            onClick={goToPreviousMonth}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h2 className="text-lg font-bold text-slate-900">
            {currentDate.getFullYear()} {monthNames[currentDate.getMonth()]}
          </h2>
          
          <button
            onClick={goToNextMonth}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Compact Calendar Grid */}
        <div className="p-4">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, index) => (
              <div key={day} className={`text-center text-xs font-medium py-1 ${index === 0 || index === 6 ? 'text-red-500' : 'text-slate-600'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days - 더 작은 크기 */}
          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((dayData, index) => (
              <button
                key={index}
                className={`
                  h-8 text-xs rounded-lg transition-all duration-200 border relative
                  ${dayData ? 'hover:bg-slate-100' : ''}
                  ${dayData?.isToday ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200'}
                  ${dayData?.isSelected ? 'bg-blue-600 text-white border-blue-600' : ''}
                  ${dayData?.hasReadLinks && !dayData?.isSelected && !dayData?.isToday ? 'bg-green-100 text-green-800 border-green-200' : ''}
                  ${!dayData?.hasReadLinks && !dayData?.isSelected && !dayData?.isToday ? 'bg-white hover:bg-slate-50' : ''}
                `}
                onClick={() => dayData && setSelectedDate(dayData.date)}
                disabled={!dayData}
              >
                {dayData && (
                  <>
                    <span className="font-medium">{dayData.day}</span>
                    {dayData.hasReadLinks && (
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full text-[10px] flex items-center justify-center
                        ${dayData.isSelected || dayData.isToday ? 'bg-white/20' : 'bg-green-600 text-white'}
                      `}>
                        {dayData.readCount}
                      </div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Date Details - 간소화 */}
      {selectedDate && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-slate-900">
              📅 {selectedDate.toLocaleDateString('ko-KR', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'short' 
              })}
            </h3>
            <span className="text-sm text-slate-600">
              {readLinksForDate.length}개
            </span>
          </div>
          
          {readLinksForDate.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {readLinksForDate.map((link) => (
                <div
                  key={link.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 text-sm line-clamp-1 mb-1">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {link.title}
                        </a>
                      </h4>
                      
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-slate-800 text-white">
                          {link.category}
                        </span>
                        {link.readAt && (
                          <span className="text-xs text-slate-500">
                            {link.readAt.toLocaleTimeString('ko-KR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500 text-sm py-4">
              이 날에는 읽은 콘텐츠가 없습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
} 