'use client';

import { useState, useEffect } from 'react';
import { CategorizedLink } from '@/types';
import { storage } from '@/lib/storage';

export default function ReadingCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [readLinksForDate, setReadLinksForDate] = useState<CategorizedLink[]>([]);
  const [monthReadLinks, setMonthReadLinks] = useState<Map<string, CategorizedLink[]>>(new Map());
  const [monthSavedLinks, setMonthSavedLinks] = useState<Map<string, CategorizedLink[]>>(new Map());
  const [totalSavedLinks, setTotalSavedLinks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Get the first and last day of the current month
  const getMonthBounds = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { firstDay, lastDay };
  };

  // Load total saved links count
  useEffect(() => {
    const loadTotalCount = async () => {
      try {
        const allLinks = await storage.getLinks();
        setTotalSavedLinks(allLinks.length);
      } catch (error) {
        console.error('Error loading total links count:', error);
      }
    };
    loadTotalCount();
  }, []);

  // Load read links for the current month
  useEffect(() => {
    const loadMonthData = async () => {
      setIsLoading(true);
      try {
        const { firstDay, lastDay } = getMonthBounds(currentDate);
        
        // Load read links
        const readLinks = await storage.getReadLinksByDateRange(firstDay, lastDay);
        const readLinksByDate = new Map<string, CategorizedLink[]>();
        readLinks.forEach(link => {
          if (link.readAt) {
            const dateKey = link.readAt.toDateString();
            if (!readLinksByDate.has(dateKey)) {
              readLinksByDate.set(dateKey, []);
            }
            readLinksByDate.get(dateKey)!.push(link);
          }
        });
        setMonthReadLinks(readLinksByDate);

        // Load all saved links and filter by month
        const allLinks = await storage.getLinks();
        const savedLinksByDate = new Map<string, CategorizedLink[]>();
        allLinks.forEach(link => {
          if (link.createdAt) {
            const date = new Date(link.createdAt);
            // Check if the date falls within the current month
            if (date >= firstDay && date <= lastDay) {
              const dateKey = date.toDateString();
              if (!savedLinksByDate.has(dateKey)) {
                savedLinksByDate.set(dateKey, []);
              }
              savedLinksByDate.get(dateKey)!.push(link);
            }
          }
        });
        setMonthSavedLinks(savedLinksByDate);
        
      } catch (error) {
        console.error('Error loading month data:', error);
        setMonthReadLinks(new Map());
        setMonthSavedLinks(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthData();
  }, [currentDate]);

  // Load links for selected date
  useEffect(() => {
    const loadDateLinks = async () => {
      try {
        const links = await storage.getReadLinksByDate(selectedDate);
        setReadLinksForDate(links);
      } catch (error) {
        console.error('Error loading date links:', error);
        setReadLinksForDate([]);
      }
    };

    loadDateLinks();
  }, [selectedDate]);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    setSelectedDate(newDate);
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
      const hasSavedLinks = monthSavedLinks.has(dateKey);
      const readCount = monthReadLinks.get(dateKey)?.length || 0;
      const savedCount = monthSavedLinks.get(dateKey)?.length || 0;
      
      days.push({
        date,
        day,
        hasReadLinks,
        hasSavedLinks,
        readCount,
        savedCount,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: selectedDate.toDateString() === date.toDateString()
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 lg:gap-4">
      {/* Calendar */}
      <div>
                      <div className="rounded-2xl overflow-hidden">
          {/* Header with Navigation and Statistics */}
          <div className="px-4 py-3 glass-card">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
                disabled={isLoading}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15 18-6-6 6-6" />
                </svg>
              </button>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  {currentDate.getFullYear()} {monthNames[currentDate.getMonth()]}
                </h2>
                {isLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-600 mx-auto mt-1"></div>
                )}
              </div>
              
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white"
                disabled={isLoading}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>


          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, index) => (
                <div key={day} className={`text-center text-xs md:text-sm font-medium py-1 ${index === 0 || index === 6 ? 'text-red-400' : 'text-gray-300'}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((dayData, index) => (
                <button
                  key={index}
                  className={`
                    h-8 md:h-10 text-xs md:text-sm rounded-lg transition-all duration-200 relative
                    ${dayData ? 'hover:bg-slate-200' : ''}
                    ${dayData?.isSelected ? 'border-2 border-gray-500' : 'border border-transparent'}
                    ${
                      dayData 
                        ? dayData.hasReadLinks && dayData.hasSavedLinks 
                          ? `bg-[#aff4c6] text-green-800 ${dayData.isToday ? 'font-bold' : ''}` // 둘 다 있는 날 - green 300
                          : dayData.hasReadLinks || dayData.hasSavedLinks 
                            ? `bg-[#cff7d3] text-green-700 ${dayData.isToday ? 'font-bold' : ''}` // 저장 또는 읽은 날 - green 200
                            : `bg-white/10 hover:bg-white/20 text-white ${dayData.isToday ? 'font-bold' : ''}` // 아무것도 없는 날
                        : ''
                    }
                  `}
                  onClick={() => dayData && setSelectedDate(dayData.date)}
                  disabled={!dayData}
                >
                  {dayData && (
                    <>
                      <span className="font-medium">{dayData.day}</span>
                      {(dayData.hasReadLinks || dayData.hasSavedLinks) && (
                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-medium
                          ${dayData.isSelected ? 'bg-gray-500 text-white'
                            : dayData.hasReadLinks && dayData.hasSavedLinks 
                              ? 'bg-white/90 text-green-700'
                              : 'bg-white/80 text-green-700'}
                        `}>
                          {dayData.hasReadLinks && dayData.hasSavedLinks 
                            ? `${dayData.savedCount}/${dayData.readCount}`
                            : dayData.hasReadLinks 
                              ? dayData.readCount
                              : dayData.savedCount}
                        </div>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Content */}
      <div>
        {/* Active Days Statistics */}
        <div className="mb-4">
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-semibold text-white">
              {new Set([...monthReadLinks.keys(), ...monthSavedLinks.keys()]).size}
            </div>
            <div className="text-base text-gray-300 font-medium">Active Days</div>
          </div>
        </div>
        
            {/* Content List */}
            {readLinksForDate.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {readLinksForDate.map((link) => (
                  <div
                    key={link.id}
                    className="glass-card rounded-lg p-2 hover:bg-white/10 transition-colors"
                  >
                    <h4 className="font-medium text-white text-base line-clamp-2 mb-1">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-300 transition-colors"
                      >
                        {link.title}
                      </a>
                    </h4>

                    {link.memo && (
                      <p className="text-sm text-gray-300 line-clamp-1">
                        {link.memo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1" strokeWidth={1.5}/>
                    <circle cx="12" cy="8" r="1" strokeWidth={1.5}/>
                    <circle cx="12" cy="16" r="1" strokeWidth={1.5}/>
                    <circle cx="8" cy="12" r="1" strokeWidth={1.5}/>
                    <circle cx="16" cy="12" r="1" strokeWidth={1.5}/>
                  </svg>
                </div>
                <p className="text-gray-300 text-sm text-center">
                  No reads yet. Ready to explore something new?
                </p>
              </div>
            )}
      </div>
    </div>
  );
} 