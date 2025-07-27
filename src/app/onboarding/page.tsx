'use client';

import { Input } from '@/components/sds';
import { storage } from '@/lib/storage'; // Added import for storage
import { supabase } from '@/lib/supabase';
import { CategorizedLink } from '@/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  
  // Filter states (for All Links section in step 2)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [readFilter, setReadFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest-added');
  const [categories] = useState<any[]>([]); // Empty for demo
  const [tags] = useState<any[]>([]); // Empty for demo

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
      title: "📅 Track Reading Habits",
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
            <div className="section-container p-8 mb-9">
              <form onSubmit={handleDemoSubmit}>
                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        type="text"
                        value={demoUrl}
                        onChange={(e) => {
                          setDemoUrl(e.target.value);
                          if (demoError) setDemoError('');
                        }}
                        placeholder="Paste a link"
                        className={`w-full h-12 px-4 glass-input text-sm font-normal ${demoError ? 'input-error' : ''}`}
                        disabled={demoLoading}
                      />
                      {demoError && (
                        <p className="text-red-400 text-xs mt-2 px-2">{demoError}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={demoMemo}
                      onChange={(e) => setDemoMemo(e.target.value)}
                      placeholder="Personal memo (optional)"
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
                      <span className="text-sm font-medium tracking-wide">AutoStash</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: AutoStash Demo & All Links */}
      {currentStep === 1 && (
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
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

            {/* AutoStash Section */}
            <div className="section-container p-8 mb-9">
              <form>
                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Paste a link"
                        className="w-full h-12 px-4 glass-input text-sm font-normal"
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Personal memo (optional)"
                      className="w-full h-12 px-4 glass-input text-sm font-normal"
                      disabled
                    />
                  </div>
                   
                  <button
                    type="button"
                    disabled
                    className="smartsort-button h-12 px-8 rounded-xl text-white font-medium disabled:opacity-50 transition-all duration-200 lg:w-auto w-full"
                  >
                    <span className="text-sm font-medium tracking-wide">AutoStash</span>
                  </button>
                </div>
              </form>
            </div>

            {/* All Links Section */}
            <div className="section-container p-6 lg:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white tracking-tight" style={{ fontSize: 'calc(1.25rem + 1px)' }}>All Links</h2>
              </div>
              
              {/* Filters with Add button */}
              <div className="mb-8">
                <div className="flex items-end justify-between gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 flex-1">
                    {/* Category Filter */}
                    <div>
                      <label className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Category
                        {selectedCategory !== 'all' && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full ml-3 shadow-sm"></div>
                        )}
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full h-11 px-4 pr-10 glass-input rounded-xl text-sm font-normal focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center] transition-all duration-200"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tag Filter */}
                    <div>
                      <label className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Tag
                        {selectedTag !== 'all' && (
                          <div className="w-2 h-2 bg-green-400 rounded-full ml-3 shadow-sm"></div>
                        )}
                      </label>
                      <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="w-full h-11 px-4 pr-10 glass-input rounded-xl text-sm font-normal focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center] transition-all duration-200"
                      >
                        <option value="all">All Tags</option>
                        {tags.map((tag) => (
                          <option key={tag.id} value={tag.name}>
                            #{tag.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Read Status Filter */}
                    <div>
                      <label className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Read Status
                        {readFilter !== 'all' && (
                          <div className="w-2 h-2 bg-purple-400 rounded-full ml-3 shadow-sm"></div>
                        )}
                      </label>
                      <select
                        value={readFilter}
                        onChange={(e) => setReadFilter(e.target.value)}
                        className="w-full h-11 px-4 pr-10 glass-input rounded-xl text-sm font-normal focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center] transition-all duration-200"
                      >
                        <option value="all">All</option>
                        <option value="read">Read Only</option>
                        <option value="unread">Unread Only</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Sort By
                        {sortBy !== 'newest-added' && (
                          <div className="w-2 h-2 bg-amber-400 rounded-full ml-3 shadow-sm"></div>
                        )}
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full h-11 px-4 pr-10 glass-input rounded-xl text-sm font-normal focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center] transition-all duration-200"
                      >
                        <option value="newest-added">Newest Added</option>
                        <option value="oldest-added">Oldest Added</option>
                        <option value="newest">Newest Read</option>
                        <option value="oldest">Oldest Read</option>
                        <option value="title">Title A-Z</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Manage Button */}
                  <div className="flex items-end">
                    <button
                      onClick={() => window.location.href = '/manage'}
                      className="h-11 w-11 glass-card rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
                      title="Manage Settings"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b border-white/10 mb-6"></div>
              
              {/* Links List */}
              {savedLink && (
                <>
                  <table className="w-full">
                    <tbody>
                      <tr className="sds-table-row group">
                        <td className="sds-table-cell w-12">
                          <div className="flex items-center justify-center">
                            <button
                              className="custom-toggle-button"
                              title="Mark as read"
                              data-checked={false}
                            >
                              <div className="toggle-circle">
                              </div>
                            </button>
                          </div>
                        </td>
                        <td className="sds-table-cell">
                          <div className="space-y-2">
                            {/* Title */}
                            <div>
                              <a
                                href={savedLink.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-white hover:text-blue-300 transition-colors line-clamp-2"
                              >
                                {savedLink.title}
                              </a>
                              <div className="text-xs text-gray-400 mt-1 font-mono">
                                {savedLink.url}
                              </div>
                            </div>
                            {/* Tags & Category */}
                            <div className="flex flex-wrap gap-1.5">
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(savedLink.category)}`}>
                                {savedLink.category}
                              </span>
                              {savedLink.tags.map((tag) => (
                                <span key={tag} className={`inline-flex px-2 py-1 text-xs rounded border font-medium ${getTagColor(tag)}`}>
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            {/* Memo */}
                            {savedLink.memo && (
                              <div className="text-sm text-gray-300 italic">
                                &ldquo;{savedLink.memo}&rdquo;
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="sds-table-cell w-16 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="text-xs text-gray-400">
                              {savedLink.createdAt.toLocaleDateString()}
                            </div>
                            <div className="flex items-center space-x-1">
                              <button className="text-gray-400 hover:text-white transition-colors p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button className="text-gray-400 hover:text-red-400 transition-colors p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {/* No results message */}
              {!savedLink && (
                <div className="text-center py-8">
                  <div className="text-gray-500">
                    No saved links yet. Start by adding your first link above!
                  </div>
                </div>
              )}
            </div>

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
          <div className="flex justify-center mb-8">
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

          <div className="w-full max-w-2xl text-center">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-white mb-3">{steps[currentStep].title}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 