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

  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      {/* Calendar */}
      <div className="xl:col-span-3">
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden">
          {/* Calendar Header */}
          <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/50">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-200/50 rounded-xl transition-all duration-200 group"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {monthNames[currentDate.getMonth()]}
                </h2>
                <p className="text-lg text-slate-600 font-medium">
                  {currentDate.getFullYear()}
                </p>
              </div>
              
              <button
                onClick={goToNextMonth}
                className="w-10 h-10 flex items-center justify-center hover:bg-slate-200/50 rounded-xl transition-all duration-200 group"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={goToToday}
                className="px-6 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-2xl hover:from-slate-700 hover:to-slate-600 transition-all duration-200 shadow-lg font-medium text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-white"></div>
                    <span>로딩 중...</span>
                  </div>
                ) : (
                  '오늘로 이동'
                )}
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-8">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day, index) => (
                <div key={day} className={`text-center text-sm font-semibold py-3 ${index === 0 || index === 6 ? 'text-red-500' : 'text-slate-600'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {generateCalendarDays().map((dayData, index) => (
                <div
                  key={index}
                  className={`
                    h-20 rounded-2xl cursor-pointer transition-all duration-200 border
                    ${dayData ? 'hover:shadow-md hover:scale-105' : ''}
                    ${dayData?.isToday ? 'ring-2 ring-slate-600 bg-slate-100 border-slate-300' : 'border-slate-200/50'}
                    ${dayData?.isSelected ? 'bg-gradient-to-br from-slate-600 to-slate-500 text-white shadow-lg border-slate-600' : ''}
                    ${dayData?.hasReadLinks && !dayData?.isSelected ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : ''}
                    ${!dayData?.hasReadLinks && !dayData?.isSelected && !dayData?.isToday ? 'bg-white/50 hover:bg-white/80' : ''}
                  `}
                  onClick={() => dayData && setSelectedDate(dayData.date)}
                >
                  {dayData && (
                    <div className="p-3 h-full flex flex-col justify-between">
                      <div className={`text-sm font-semibold ${dayData.isSelected ? 'text-white' : dayData.isToday ? 'text-slate-900' : 'text-slate-700'}`}>
                        {dayData.day}
                      </div>
                      {dayData.hasReadLinks && (
                        <div className="flex items-center justify-center">
                          <div className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${dayData.isSelected ? 'bg-white/20 text-white' : 'bg-green-600 text-white'}
                          `}>
                            {dayData.readCount}개
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Details & Statistics */}
      <div className="xl:col-span-2 space-y-6">
        {/* Selected Date Details */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  {selectedDate ? selectedDate.toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'short' 
                  }) : '날짜 선택'}
                </h3>
                <p className="text-sm text-slate-600">
                  {selectedDate ? `${readLinksForDate.length}개의 읽은 콘텐츠` : '캘린더에서 날짜를 선택하세요'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6 max-h-96 overflow-y-auto">
            {selectedDate ? (
              readLinksForDate.length > 0 ? (
                <div className="space-y-4">
                  {readLinksForDate.map((link) => (
                    <div
                      key={link.id}
                      className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/50 rounded-2xl p-5 hover:shadow-md transition-all duration-200 group"
                    >
                      <h4 className="font-semibold text-slate-900 mb-3 group-hover:text-slate-800 transition-colors">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline line-clamp-2"
                        >
                          {link.title}
                        </a>
                      </h4>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <span className="inline-flex px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 text-white">
                          {link.category}
                        </span>
                        {link.readAt && (
                          <span className="text-xs text-slate-500 font-medium">
                            {link.readAt.toLocaleTimeString('ko-KR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      
                      {link.tags && link.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {link.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex px-2 py-1 text-xs rounded-lg bg-green-100 text-green-700 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {link.memo && (
                        <p className="text-sm text-slate-600 mt-3 line-clamp-3">
                          {link.memo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">
                    이 날에는 읽은 콘텐츠가 없습니다
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">
                  캘린더에서 날짜를 클릭하여<br />
                  읽은 콘텐츠를 확인하세요
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {monthNames[currentDate.getMonth()]} 통계
              </h3>
              <p className="text-sm text-slate-600">
                이번 달 읽기 활동
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50">
              <span className="text-slate-700 font-medium">활동 일수</span>
              <span className="text-2xl font-bold text-slate-900">{monthReadLinks.size}일</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200/50">
              <span className="text-slate-700 font-medium">총 읽은 콘텐츠</span>
              <span className="text-2xl font-bold text-green-700">
                {Array.from(monthReadLinks.values()).reduce((total, links) => total + links.length, 0)}개
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 