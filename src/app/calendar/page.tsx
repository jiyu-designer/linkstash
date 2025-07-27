'use client';

import { storage } from '@/lib/storage';
import { CategorizedLink } from '@/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CalendarPage() {
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

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← 홈으로
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">읽기 캘린더</h1>
            <button
              onClick={goToToday}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              오늘
            </button>
          </div>
          <p className="text-lg text-gray-600">
            날짜별로 읽은 콘텐츠를 확인하세요
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Calendar Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    ←
                  </button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((dayData, index) => (
                    <div
                      key={index}
                      className={`
                        h-16 border border-gray-200 rounded-md cursor-pointer transition-all
                        ${dayData ? 'hover:bg-blue-50' : ''}
                        ${dayData?.isToday ? 'ring-2 ring-blue-500' : ''}
                        ${dayData?.isSelected ? 'bg-blue-100' : ''}
                        ${dayData?.hasReadLinks ? 'bg-green-50' : ''}
                      `}
                      onClick={() => dayData && setSelectedDate(dayData.date)}
                    >
                      {dayData && (
                        <div className="p-1 h-full flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {dayData.day}
                          </div>
                          {dayData.hasReadLinks && (
                            <div className="flex-1 flex items-end">
                              <div className="w-full text-xs text-green-600 font-medium">
                                {dayData.readCount}개 읽음
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

          {/* Selected Date Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate ? selectedDate.toLocaleDateString() : '날짜를 선택하세요'}
                </h3>
              </div>
              
              <div className="p-6">
                {selectedDate ? (
                  readLinksForDate.length > 0 ? (
                    <div className="space-y-4">
                      {readLinksForDate.map((link) => (
                        <div
                          key={link.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                        >
                          <h4 className="font-medium text-gray-900 mb-2">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600"
                            >
                              {link.title}
                            </a>
                          </h4>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {link.category}
                            </span>
                            {link.readAt && (
                              <span className="text-xs text-gray-500">
                                {link.readAt.toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          
                          {link.tags && link.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {link.tags.map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {link.memo && (
                            <p className="text-sm text-gray-600 mt-2">
                              {link.memo}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">
                      이 날에는 읽은 콘텐츠가 없습니다.
                    </p>
                  )
                ) : (
                  <p className="text-gray-500 text-center">
                    캘린더에서 날짜를 클릭하여 해당 날짜에 읽은 콘텐츠를 확인하세요.
                  </p>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {monthNames[currentDate.getMonth()]} 통계
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">읽은 날:</span>
                  <span className="font-medium">{monthReadLinks.size}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 읽은 콘텐츠:</span>
                  <span className="font-medium">
                    {Array.from(monthReadLinks.values()).reduce((total, links) => total + links.length, 0)}개
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 