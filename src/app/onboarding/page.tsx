'use client';

import AllLinksSection from '@/components/AllLinksSection'; // Added import for AllLinksSection
import AutoStashSection from '@/components/AutoStashSection'; // Added import for AutoStashSection
import SummaryAndCalendarSection from '@/components/SummaryAndCalendarSection';
import { storage } from '@/lib/storage'; // Added import for storage
import { supabase } from '@/lib/supabase';
import { CategorizedLink } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// URL 유효성 검사 함수
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

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
  const [demoError, setDemoError] = useState('');
  
  // Saved link state for displaying in step 2
  const [savedLink, setSavedLink] = useState<CategorizedLink | null>(null);
  
  // For step 1 (All Links section)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest-added');
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // Add results state for Summary section
  const [results, setResults] = useState<CategorizedLink[]>([]);

  // Load user data for Summary section
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userLinks = await storage.getLinks();
          setResults(userLinks);
          
          // Also load categories and tags
          const userCategories = await storage.getCategories();
          const userTags = await storage.getTags();
          setCategories(userCategories);
          setTags(userTags);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Handler functions for All Links section
  const handleToggleReadStatus = (linkId: string) => {
    // Demo function - doesn't actually update data
    console.log('Toggle read status for:', linkId);
  };

  const handleEditLink = (link: CategorizedLink) => {
    // Demo function - doesn't actually edit
    console.log('Edit link:', link);
  };

  const handleDeleteLink = (linkId: string) => {
    // Demo function - doesn't actually delete
    console.log('Delete link:', linkId);
  };

  // Color functions for categories and tags
  const getCategoryColor = (category: string) => {
    const colors = {
      'Technology': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Design': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Business': 'bg-green-500/20 text-green-300 border-green-500/30',
      'Productivity': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'Other': 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[category as keyof typeof colors] || colors['Other'];
  };

  const getTagColor = (tag: string) => {
    return 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20 cursor-pointer transition-colors';
  };

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoError('');

    // URL 유효성 검사
    if (!demoUrl.trim()) {
      setDemoError('Please enter a URL');
      return;
    }

    if (!isValidUrl(demoUrl)) {
      setDemoError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setDemoLoading(true);

    try {
      // 실제 API 호출
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: demoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Categorization failed');
      }

      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create new link object with memo and auto-generated tags
      const now = new Date();
      const newLink: CategorizedLink = {
        id: crypto.randomUUID(),
        url: data.url,
        title: data.title,
        description: data.description,
        category: data.category,
        tags: Array.isArray(data.tags) ? data.tags : [],
        memo: demoMemo.trim() || undefined,
        isRead: false,
        readAt: undefined,
        userId: user.id,
        createdAt: now,
        updatedAt: now
      };

      // Auto-create category and tags using storage utility
      await storage.autoCreateCategoryAndTags(data.category, data.tags || []);

      // Add the new link
      await storage.addLink(newLink);
      
      // Save the link data for display in step 2
      setSavedLink(newLink);
      
      // Move to next step to show the results
      setCurrentStep(1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Categorization service is temporarily unavailable. Please try again later.';
      setDemoError(errorMessage);
    } finally {
      setDemoLoading(false);
    }
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
      title: "Track Reading Habits",
      description: "Monitor your daily saving and reading records at a glance"
    }
  ];

  return (
    <div className="min-h-screen bg-black relative">
      {/* Step 0: SmartSort Demo with Stepper */}
      {currentStep === 0 && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          {/* Progress Steps - Top of the group */}
          <div className="flex justify-center mb-20">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer hover:scale-105 ${
                      index <= currentStep 
                        ? 'text-white' 
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    style={index <= currentStep ? {
                      backgroundColor: 'rgba(219, 30, 255, 0.4)',
                      backdropFilter: 'blur(12px) saturate(180%)',
                      border: '1px solid rgba(219, 30, 255, 0.3)'
                    } : {}}>
                    {index + 1}
                  </button>
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

          {/* Header Section - Above SmartSort */}
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-white mb-3">Paste a link and click AutoStash</h3>
          </div>

          {/* SmartSort Form - Centered */}
          <div className="w-full max-w-4xl">
            <AutoStashSection
              url={demoUrl}
              memo={demoMemo}
              isLoading={demoLoading}
              error={demoError}
              onUrlChange={(value) => {
                setDemoUrl(value);
                if (demoError) setDemoError('');
              }}
              onMemoChange={setDemoMemo}
              onSubmit={handleDemoSubmit}
              buttonText="AutoStash"
              placeholder="Paste a link"
            />
          </div>
        </div>
      )}

      {/* Step 1: AutoStash Demo & All Links */}
      {currentStep === 1 && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          {/* Progress Steps */}
          <div className="flex justify-center mb-20">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer hover:scale-105 ${
                      index <= currentStep
                        ? 'text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    style={index <= currentStep ? {
                      backgroundColor: 'rgba(219, 30, 255, 0.4)',
                      backdropFilter: 'blur(12px) saturate(180%)',
                      border: '1px solid rgba(219, 30, 255, 0.3)'
                    } : {}}>
                    {index + 1}
                  </button>
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

          <div className="w-full max-w-6xl space-y-12">
            {/* Page Title */}
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-white mb-3">No more mess. Auto-Magic Tagging</h3>
            </div>

            {/* All Links Section */}
            <AllLinksSection
              results={savedLink ? [savedLink] : []}
              categories={categories}
              tags={tags}
              selectedCategory={selectedCategory}
              selectedTag={selectedTag}
              readFilter={readFilter}
              sortBy={sortBy}
              onCategoryChange={setSelectedCategory}
              onTagChange={setSelectedTag}
              onReadFilterChange={setReadFilter}
              onSortByChange={setSortBy}
              onToggleReadStatus={handleToggleReadStatus}
              onEditLink={handleEditLink}
              onDeleteLink={handleDeleteLink}
              getCategoryColor={getCategoryColor}
              getTagColor={getTagColor}
              showManageButton={false}
            />

            {/* Navigation Buttons for Step 1 */}
            <div className="flex justify-center items-center gap-3 mt-12 w-full max-w-6xl">
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
              >
                Back
              </button>
              
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          {/* Progress Steps for other steps */}
          <div className="flex justify-center mb-20">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-pointer hover:scale-105 ${
                      index <= currentStep
                        ? 'text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    style={index <= currentStep ? {
                      backgroundColor: 'rgba(219, 30, 255, 0.4)',
                      backdropFilter: 'blur(12px) saturate(180%)',
                      border: '1px solid rgba(219, 30, 255, 0.3)'
                    } : {}}>
                    {index + 1}
                  </button>
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

          <div className="w-full max-w-6xl text-center">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-white mb-3">{steps[currentStep].title}</h3>
            </div>

            {/* Summary Section */}
            <SummaryAndCalendarSection results={results} />

            {/* Start Button */}
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => router.push('/')}
                className="smartsort-button h-12 px-8 rounded-xl text-white font-medium transition-all duration-200 lg:w-auto w-full"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 