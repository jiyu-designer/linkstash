'use client';

import { Input } from '@/components/sds';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// 온보딩용 가짜 데이터
const SAMPLE_LINKS = [
  {
    id: 'sample-1',
    title: 'The Future of Interfaces: Beyond the Screen',
    url: 'https://futureinterfaces.com/article',
    tags: ['AI', 'UX', 'Design Trends'],
    memo: '제로 UI에 대한 인사이트가 인상적.',
    savedAt: '2025-01-25',
    readAt: '2025-01-25',
    category: 'Technology'
  },
  {
    id: 'sample-2',
    title: 'Designing Calm Technology',
    url: 'https://calmtech.com/post',
    tags: ['Human-Centered', 'Technology'],
    memo: '기술이 더 조용할 수도 있다는 개념!',
    savedAt: '2025-01-24',
    readAt: null,
    category: 'Design'
  },
  {
    id: 'sample-3',
    title: 'Building Sustainable Digital Products',
    url: 'https://sustainabletech.dev/guide',
    tags: ['Sustainability', 'Development'],
    memo: '환경을 생각하는 개발 방법론',
    savedAt: '2025-01-23',
    readAt: '2025-01-24',
    category: 'Development'
  },
  {
    id: 'sample-4',
    title: 'The Psychology of User Retention',
    url: 'https://userpsych.com/retention',
    tags: ['Psychology', 'Product'],
    memo: '사용자 행동 패턴에 대한 깊은 통찰',
    savedAt: '2025-01-22',
    readAt: null,
    category: 'Product'
  }
];

const SAMPLE_CALENDAR_DATA = [
  { date: '2025-01-25', saved: 2, read: 1 },
  { date: '2025-01-24', saved: 1, read: 2 },
  { date: '2025-01-23', saved: 1, read: 1 },
  { date: '2025-01-22', saved: 1, read: 0 },
  { date: '2025-01-21', saved: 0, read: 1 },
  { date: '2025-01-20', saved: 1, read: 1 },
  { date: '2025-01-19', saved: 1, read: 0 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Demo SmartSort states
  const [demoUrl, setDemoUrl] = useState('');
  const [demoMemo, setDemoMemo] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Design': 'bg-purple-100 text-purple-800',
      'Development': 'bg-green-100 text-green-800',
      'Product': 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getTagColor = (tag: string) => {
    const colors: { [key: string]: string } = {
      'AI': 'bg-red-50 text-red-700 border-red-200',
      'UX': 'bg-blue-50 text-blue-700 border-blue-200',
      'Design Trends': 'bg-purple-50 text-purple-700 border-purple-200',
      'Human-Centered': 'bg-green-50 text-green-700 border-green-200',
      'Technology': 'bg-gray-50 text-gray-700 border-gray-200',
      'Sustainability': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Development': 'bg-blue-50 text-blue-700 border-blue-200',
      'Psychology': 'bg-pink-50 text-pink-700 border-pink-200',
      'Product': 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return colors[tag] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrl.trim()) return;
    
    setDemoLoading(true);
    // Simulate processing time
    setTimeout(() => {
      setDemoLoading(false);
      // Move to next step to show the results
      setCurrentStep(1);
    }, 2000);
  };

  const handleStartApp = async () => {
    setLoading(true);
    try {
      // Update user metadata to set firstLogin to false
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { firstLogin: false }
        });
      }
      
      router.push('/');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "🔗 Smart Link Management",
      description: "AI automatically generates categories and tags for you"
    },
    {
      title: "📚 View Saved Links",
      description: "Manage categorized links systematically with categories and tags"
    },
    {
      title: "📅 Track Reading Habits",
      description: "Monitor your daily saving and reading records at a glance"
    }
  ];

  return (
    <div className="min-h-screen bg-black relative">
      {/* Progress Steps - Fixed at top, centered */}
      <div className="fixed top-0 left-0 right-0 flex justify-center pt-[240px] z-10">
        <div className="flex items-center">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index <= currentStep 
                  ? 'text-white' 
                  : 'bg-gray-700 text-gray-400'
              }`}
              style={index <= currentStep ? {
                backgroundColor: 'rgba(219, 30, 255, 0.4)',
                backdropFilter: 'blur(12px) saturate(180%)',
                border: '1px solid rgba(219, 30, 255, 0.3)'
              } : {}}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-6 transition-colors ${
                  index < currentStep 
                    ? 'bg-gray-600' 
                    : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SmartSort Section with Header - Absolute center of page */}
      {currentStep === 0 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-4xl px-6 pointer-events-auto flex flex-col items-center">
            {/* Header Section - 40px above SmartSort, centered */}
            <div className="text-center mb-[40px]">
              <h3 className="text-3xl font-bold text-white mb-3">Paste a link and click Smartsort</h3>
            </div>
            
            {/* SmartSort Form - centered */}
            <div className="w-full">
              <div className="glass-card p-8">
                <form onSubmit={handleDemoSubmit}>
                  <div className="flex flex-col lg:flex-row gap-5">
                    <div className="flex-1">
                      <Input
                        type="url"
                        placeholder="Enter URL address"
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        className="w-full h-12 px-4 glass-input text-sm font-normal"
                        disabled={demoLoading}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Personal memo (optional)"
                        value={demoMemo}
                        onChange={(e) => setDemoMemo(e.target.value)}
                        className="w-full h-12 px-4 glass-input text-sm font-normal"
                        disabled={demoLoading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={demoLoading}
                      className="smartsort-button h-12 px-8 rounded-xl text-white font-medium disabled:opacity-50 transition-all duration-200 lg:w-auto w-full"
                    >
                      {demoLoading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-3"></div>
                          <span className="text-sm font-medium">Analyzing</span>
                        </span>
                      ) : (
                        <span className="text-sm font-medium tracking-wide">SmartSort</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Next Button - Below SmartSort, centered */}
            {currentStep < steps.length - 1 && (
              <div className="flex justify-center mt-[120px]">
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other step content */}
      <div className="max-w-6xl mx-auto px-6">
        {currentStep === 1 && (
          <div className="pt-12 pb-20">
            <div className="grid gap-8">
              {/* Links Section */}
              <div className="glass-card p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Saved Links</h3>
                <div className="space-y-4">
                  {SAMPLE_LINKS.map((link) => (
                    <div key={link.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/8 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1 hover:text-blue-300 transition-colors cursor-pointer">
                            {link.title}
                          </h4>
                          <p className="text-sm text-gray-400 truncate">
                            {link.url}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {link.readAt && (
                            <span className="w-2 h-2 bg-green-400 rounded-full" title="Read"></span>
                          )}
                          <button className="text-gray-400 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getCategoryColor(link.category)}`}>
                            {link.category}
                          </span>
                          {link.tags.map((tag) => (
                            <span key={tag} className={`inline-flex px-2 py-1 text-xs rounded border ${getTagColor(tag)}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        {link.memo && (
                          <p className="text-sm text-gray-300 italic">
                            &ldquo;{link.memo}&rdquo;
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-gray-400 pt-2">
                          <span>Saved: {link.savedAt}</span>
                          {link.readAt && <span>Read: {link.readAt}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="pt-12 pb-20">
            <div className="grid gap-8">
              {/* Calendar Section */}
              <div className="glass-card p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Reading Calendar</h3>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">7</div>
                    <div className="text-sm text-gray-300">This Week Saved</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">5</div>
                    <div className="text-sm text-gray-300">This Week Read</div>
                  </div>
                  <div className="glass-card p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">71%</div>
                    <div className="text-sm text-gray-300">Reading Rate</div>
                  </div>
                </div>

                {/* Calendar View */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Last 7 Days Activity</h4>
                  <div className="space-y-3">
                    {SAMPLE_CALENDAR_DATA.map((day) => (
                      <div key={day.date} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex justify-between items-center">
                          <div className="text-white font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-300">
                              📥 {day.saved} saved
                            </span>
                            <span className="text-green-300">
                              ✅ {day.read} read
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Habit Message */}
                <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-400/20">
                  <div className="text-center">
                    <div className="text-xl mb-2">🎯</div>
                    <h4 className="text-lg font-medium text-white mb-2">Daily saving habit!</h4>
                    <p className="text-gray-300">Building knowledge through consistent learning</p>
                  </div>
                </div>

                {/* Start Button */}
                <div className="mt-8 text-center">
                  <button
                    onClick={handleStartApp}
                    disabled={loading}
                    className="glass-button px-8 py-3 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-lg"
                  >
                    {loading ? 'Preparing...' : '🚀 Start Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Only Previous button for other steps */}
        {currentStep > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20 bg-gradient-to-r from-gray-500/20 to-gray-600/20"
              >
                Previous
              </button>
              {currentStep < steps.length - 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 