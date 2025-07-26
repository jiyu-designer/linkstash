'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategorizedLink, Category, Tag } from '@/types';
import { storage } from '@/lib/storage';
import { getCurrentUser, onAuthStateChange, signInWithGoogle, signInWithKakao, type User } from '@/lib/auth';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearAuthData, forceAuthReset } from '@/lib/clear-auth';
import ReadingCalendar from '@/components/ReadingCalendar';
import AuthButton from '@/components/AuthButton';
import EmailAuthForm from '@/components/EmailAuthForm';
import AntiExtension from './anti-extension';
import { Button, ButtonDanger, Input } from '@/components/sds';


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [url, setUrl] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<CategorizedLink[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingLink, setEditingLink] = useState<CategorizedLink | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Filter and sort states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all'); // 'all', 'read', 'unread'
  const [sortBy, setSortBy] = useState<string>('newest-added'); // 'newest-added', 'oldest-added', 'newest', 'oldest', 'title'

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Daily usage tracking functions
  const getDailyUsageKey = (userId: string) => `smartsort_usage_${userId}_${new Date().toDateString()}`;
  
  const getDailyUsage = (userId: string): number => {
    if (typeof window === 'undefined') return 0;
    const key = getDailyUsageKey(userId);
    return parseInt(localStorage.getItem(key) || '0', 10);
  };

  const incrementDailyUsage = (userId: string): void => {
    if (typeof window === 'undefined') return;
    const key = getDailyUsageKey(userId);
    const current = getDailyUsage(userId);
    localStorage.setItem(key, (current + 1).toString());
  };

  const isExemptUser = (userEmail: string): boolean => {
    return userEmail === 'jiyu0719@gmail.com';
  };

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Filter and sort results
  const getFilteredAndSortedResults = () => {
    let filtered = [...results];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(link => link.category === selectedCategory);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(link => 
        link.tags && link.tags.includes(selectedTag)
      );
    }

    // Filter by read status
    if (readFilter === 'read') {
      filtered = filtered.filter(link => link.isRead);
    } else if (readFilter === 'unread') {
      filtered = filtered.filter(link => !link.isRead);
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest-added':
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest-added':
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'newest':
          if (!a.readAt && !b.readAt) return 0;
          if (!a.readAt) return 1;
          if (!b.readAt) return -1;
          return new Date(b.readAt).getTime() - new Date(a.readAt).getTime();
        case 'oldest':
          if (!a.readAt && !b.readAt) return 0;
          if (!a.readAt) return 1;
          if (!b.readAt) return -1;
          return new Date(a.readAt).getTime() - new Date(b.readAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredResults = getFilteredAndSortedResults();

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedTag, readFilter, sortBy]);

  // Check authentication state and load data
  useEffect(() => {
    setMounted(true);
    
    // Handle OAuth callback from URL
    const handleOAuthCallback = () => {
      const currentURL = window.location.href;
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      console.log('🔍 OAuth 콜백 확인:', {
        url: currentURL,
        hash: window.location.hash,
        search: window.location.search,
        hashParams: Object.fromEntries(hashParams),
        searchParams: Object.fromEntries(searchParams)
      });
      
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const error = hashParams.get('error') || searchParams.get('error');
      const code = searchParams.get('code');
      
      if (error) {
        console.error('❌ 인증 오류 감지:', error);
        clearAuthData();
        return;
      }
      
      if (accessToken) {
        console.log('✅ OAuth 토큰 감지 - 로그인 처리 중...', accessToken.substring(0, 20) + '...');
        
        // Extract session data from URL
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const expiresAt = hashParams.get('expires_at') || searchParams.get('expires_at');
        
        if (refreshToken) {
          console.log('🔄 세션 설정 중...');
          // Set the session with Supabase
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          }).then(({ data, error }: any) => {
            if (error) {
              console.error('❌ 세션 설정 오류:', error);
            } else {
              console.log('✅ 세션 설정 성공:', data.user?.email);
              // Clear URL after successful session setup
              window.history.replaceState(null, '', window.location.pathname);
            }
          });
        } else {
          console.warn('⚠️ refresh_token이 없어서 세션 설정을 건너뜀');
          // Still clear URL
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
      
      if (code) {
        console.log('🔑 OAuth 코드 감지:', code.substring(0, 20) + '...');
      }
    };
    
    handleOAuthCallback();
    
    const loadData = async () => {
      try {
        const [links, categories, tags] = await Promise.all([
          storage.getLinks(),
          storage.getCategories(),
          storage.getTags()
        ]);
        setResults(links);
        setCategories(categories);
        setTags(tags);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    // If Supabase is not configured, skip authentication and use localStorage mode
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured - using localStorage mode');
      setUser(null); // No user, but app will work in localStorage mode
      setAuthLoading(false);
      loadData();
      return;
    }
    
    // Get current user on mount (only if Supabase is configured)
    console.log('🚀 초기 사용자 세션 확인 시작...');
    getCurrentUser().then((currentUser) => {
      console.log('👤 사용자 세션 결과:', currentUser ? `로그인됨: ${currentUser.email}` : '로그인되지 않음');
      setUser(currentUser);
      setAuthLoading(false);
      
      // Only load data if user is authenticated
      if (currentUser) {
        console.log('📊 사용자 데이터 로딩 시작...');
        loadData();
      }
    }).catch((error) => {
      console.error('❌ 초기 사용자 로드 오류:', error);
      setAuthLoading(false);
      setUser(null);
      // Clear corrupted auth data
      clearAuthData();
    });

    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange((currentUser) => {
      console.log('🔄 Auth state changed:', {
        user: currentUser?.email || 'logged out',
        hasUser: !!currentUser,
        timestamp: new Date().toISOString()
      });
      setUser(currentUser);
      setAuthLoading(false);
      
      // Load or clear data based on auth state
      if (currentUser) {
        console.log('📊 Loading user data for:', currentUser.email);
        loadData();
      } else {
        // Clear data when user logs out
        console.log('🧹 Clearing data on logout');
        setResults([]);
        setCategories([]);
        setTags([]);
      }
    });

    // Listen for storage updates from other components
    const handleLinksUpdate = (event: CustomEvent) => {
      setResults(event.detail);
    };
    
    const handleCategoriesUpdate = (event: CustomEvent) => {
      setCategories(event.detail);
    };
    
    const handleTagsUpdate = (event: CustomEvent) => {
      setTags(event.detail);
    };

    window.addEventListener('storage-links-updated', handleLinksUpdate as EventListener);
    window.addEventListener('storage-categories-updated', handleCategoriesUpdate as EventListener);
    window.addEventListener('storage-tags-updated', handleTagsUpdate as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage-links-updated', handleLinksUpdate as EventListener);
      window.removeEventListener('storage-categories-updated', handleCategoriesUpdate as EventListener);
      window.removeEventListener('storage-tags-updated', handleTagsUpdate as EventListener);
    };
  }, []);

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      console.log('🔐 Google 로그인 시작...');
      setAuthLoading(true);
      setError('');
      
      const result = await signInWithGoogle();
      console.log('🔐 Google 로그인 응답:', result);
      
      // Note: 실제 로그인 상태는 onAuthStateChange에서 처리됨
    } catch (error) {
      console.error('❌ Google 로그인 실패:', error);
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      setAuthLoading(false);
    }
  };

  // Handle Kakao Sign In
  const handleKakaoSignIn = async () => {
    try {
      await signInWithKakao();
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // Handle Email Auth Success
  const handleEmailAuthSuccess = () => {
    setShowEmailAuth(false);
    setError(''); // Clear any errors
    // User state will be updated by the auth state change listener
  };

  // Handle showing email auth form
  const handleShowEmailAuth = () => {
    setShowEmailAuth(true);
    setError(''); // Clear any errors
  };

  // Handle canceling email auth
  const handleCancelEmailAuth = () => {
    setShowEmailAuth(false);
    setError(''); // Clear any errors
  };

  // Toggle read status
  const handleToggleReadStatus = async (linkId: string) => {
    try {
      await storage.toggleReadStatus(linkId);
      // Refresh the results
      const updatedLinks = await storage.getLinks();
      setResults(updatedLinks);
    } catch (error) {
      console.error('Error toggling read status:', error);
      alert('Failed to change read status.');
    }
  };

  // Edit link function
  const handleEditLink = (link: CategorizedLink) => {
    setEditingLink(link);
    setShowEditModal(true);
  };

  // Delete link function
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      await storage.deleteLink(linkId);
      // Refresh the results
      const updatedLinks = await storage.getLinks();
      setResults(updatedLinks);
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link.');
    }
  };

  // Save edited link
  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLink) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const memo = formData.get('memo') as string;
    const category = formData.get('category') as string;
    const tagsInput = formData.get('tags') as string;
    
    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      await storage.updateLink(editingLink.id, {
        title: title.trim(),
        memo: memo.trim() || undefined,
        category: category,
        tags: tags
      });

      // Auto-create category and tags if they don't exist
      await storage.autoCreateCategoryAndTags(category, tags);

      // Refresh data
      const [updatedLinks, updatedCategories, updatedTags] = await Promise.all([
        storage.getLinks(),
        storage.getCategories(),
        storage.getTags()
      ]);
      
      setResults(updatedLinks);
      setCategories(updatedCategories);
      setTags(updatedTags);
      
      setShowEditModal(false);
      setEditingLink(null);
    } catch (error) {
      console.error('Error updating link:', error);
      alert('링크 업데이트에 실패했습니다.');
    }
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return urlString.startsWith('http://') || urlString.startsWith('https://');
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // URL 유효성 검사
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setIsLoading(true);

    try {
      // 실제 API 호출
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Categorization failed');
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
        memo: memo.trim() || undefined,
        isRead: false,
        readAt: undefined,
        userId: user!.id, // Current user ID
        createdAt: now,
        updatedAt: now
      };

      // Auto-create category and tags using storage utility
      await storage.autoCreateCategoryAndTags(data.category, data.tags || []);

      // Add the new link
      await storage.addLink(newLink);
      setUrl(''); // 입력 필드 초기화
      setMemo(''); // 메모 필드 초기화
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Categorization service is temporarily unavailable. Please try again later.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
          <p className="text-sm text-gray-300 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page for unauthenticated users (only if Supabase is configured)
  if (!user && isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-12 h-12 glass-card rounded-xl flex items-center justify-center backdrop-blur-20 bg-white/10 border border-white/20 mb-6">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              LinkStash
            </h1>
            <p className="text-gray-300 text-lg font-medium">
              Save smartly. Learn deeply
            </p>
          </div>
          
          {/* Login Card */}
          <div className="section-container p-8">
            {/* Features */}
            <div className="glass-card rounded-2xl p-6 mb-8">
              <div className="flex items-center mb-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                <h3 className="font-semibold text-white text-sm">Key Features</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-300">Automatic URL categorization and tag generation</span>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-300">Read status management and calendar view</span>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-300">Organize by categories and tags</span>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-gray-300">Personal notes and bookmark management</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </div>
            )}
            
            {/* Auth Buttons */}
            {!showEmailAuth ? (
              <div className="space-y-4">
                {/* Google Login Button */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 glass-button border border-white/20 rounded-2xl hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium text-white group"
                >
                  <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                {/* Kakao Login Button - 임시 숨김 (scope 에러 해결 중) */}
                {false && (
                  <button
                    onClick={handleKakaoSignIn}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#FEE500] border border-[#FEE500] rounded-2xl hover:bg-[#FDD835] focus:outline-none focus:ring-2 focus:ring-[#FEE500] transition-all duration-200 font-medium text-slate-900 group"
                  >
                    <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#000000"
                        d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.68 5.1 4.2 6.6L5.4 20.7c-.15.45.3.84.72.63L9.6 19.2c.72.12 1.56.18 2.4.18 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"
                      />
                    </svg>
                    Continue with Kakao
                  </button>
                )}
                
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-black text-gray-400 font-medium">or</span>
                  </div>
                </div>
                
                {/* Email Login Button */}
                <button
                  onClick={handleShowEmailAuth}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 glass-button border border-white/20 rounded-2xl hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium text-white group"
                >
                  <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Continue with Email
                </button>
              </div>
            ) : (
              <EmailAuthForm 
                onSuccess={handleEmailAuthSuccess}
                onCancel={handleCancelEmailAuth}
              />
            )}
            
            {!showEmailAuth && (
              <p className="text-xs text-gray-400 text-center mt-6 font-medium">
                Your data is securely protected by our privacy policy
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main application for authenticated users
  return (
    <>
      <AntiExtension />
      <div className="min-h-screen bg-black">
      <div className="mx-auto px-10 lg:px-[120px] py-8">
        {/* localStorage Mode Notice */}
        {!isSupabaseConfigured() && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">로컬 저장소 모드</h3>
                <p className="text-sm text-blue-700">데이터가 브라우저에 저장됩니다. 로그인 없이 모든 기능을 사용하실 수 있습니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* Header with Auth Button */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 glass-card rounded-xl flex items-center justify-center backdrop-blur-20 bg-white/10 border border-white/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">
                LinkStash
              </h1>
              <p className="text-base text-gray-300 font-medium">
                Save smartly. Learn deeply
              </p>
            </div>
          </div>
          {isSupabaseConfigured() && <AuthButton />}
        </header>

        {/* URL Input Form - 미니멀 버전 */}
        <div className="section-container p-5 lg:p-6 mb-[60px]">
          <form onSubmit={handleSubmit}>
                          <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL address"
                  className="flex-1"
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex-1">
                <Input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Personal memo (optional)"
                  className="flex-1"
                  disabled={isLoading}
                />
              </div>
               
              <button
                type="submit"
                disabled={isLoading}
                className="glass-button px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50 transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20"
                style={{ 
                  lineHeight: 1,
                  background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
                }}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-white mr-2"></div>
                    Analyzing
                  </span>
                ) : (
                  'SmartSort'
                )}
              </button>
            </div>
              
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl mt-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Main Content: All Links, Summary, Reading Calendar (Vertical Stack) */}
        <div className="space-y-[60px]">
          
          {/* All Links Section */}
          <div className="section-container p-6 lg:p-8">
                {/* Filters with Add button */}
                <div className="mb-4 rounded-lg">
                  <div className="flex items-end justify-between gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                    {/* Category Filter */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        Category
                        {selectedCategory !== 'all' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 pr-8 glass-input rounded-md text-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center]"
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
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        Tag
                        {selectedTag !== 'all' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </label>
                      <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="w-full px-3 py-2 pr-8 glass-input rounded-md text-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center]"
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
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        Read Status
                        {readFilter !== 'all' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </label>
                      <select
                        value={readFilter}
                        onChange={(e) => setReadFilter(e.target.value)}
                        className="glass-input w-full px-3 py-2 pr-8 rounded-md text-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center]"
                      >
                        <option value="all">All</option>
                        <option value="read">Read Only</option>
                        <option value="unread">Unread Only</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-300 mb-3">
                        Sort By
                        {sortBy !== 'newest-added' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                        )}
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="glass-input w-full px-3 py-2 pr-8 rounded-md text-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xIDFMNiA2TDExIDEiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K')] bg-no-repeat bg-[position:calc(100%-16px)_center]"
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
                        className="px-4 py-3 text-gray-400 hover:text-white transition-colors rounded-lg"
                        title="Manage"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Divider */}
                <div className="border-b border-white/10 mb-6"></div>
                
                {/* Links List */}
                {results.length > 0 && (
                  <>
                    <table className="w-full">
                    <tbody>
                      {(() => {
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedResults = filteredResults.slice(startIndex, endIndex);
                        
                        return paginatedResults.map((result) => (
                          <tr key={result.id} className={`py-4 hover:px-8 hover:rounded-2xl transition-all duration-200 ${result.isRead ? '' : ''}`}>
                          <td className="pr-4 py-4 w-8">
                            <input
                              type="checkbox"
                              checked={result.isRead}
                              onChange={() => handleToggleReadStatus(result.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 cursor-pointer border border-white/30 bg-transparent checked:bg-blue-500 checked:border-blue-500 rounded-full"
                              title={!result.isRead ? 'Read' : ''}
                            />
                          </td>
                          <td className="py-4 w-full">
                            <div>
                              {/* Title */}
                              <div className="mb-1">
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white font-medium text-base line-clamp-2 hover:text-blue-300 transition-colors"
                                >
                                  {result.title}
                                </a>
                              </div>
                              
                              {/* Category + Tags */}
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                <span 
                                  onClick={() => setSelectedCategory(result.category)}
                                  className="sds-chip sds-chip-category px-1.5 py-0.5 rounded-md text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 cursor-pointer hover:bg-blue-500/30 transition-colors" 
                                  style={{ fontSize: '10px' }}
                                >
                                  {result.category}
                                </span>
                                {result.tags.map((tag, index) => (
                                  <span 
                                    key={index} 
                                    onClick={() => setSelectedTag(tag)}
                                    className="sds-chip sds-chip-tag px-1.5 py-0.5 rounded-md text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-pointer hover:bg-purple-500/30 transition-colors" 
                                    style={{ fontSize: '10px' }}
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              
                              {/* Memo */}
                              {result.memo && (
                                <div className="text-gray-300 text-xs line-clamp-2 mt-2">
                                  {result.memo}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 w-auto pl-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditLink(result)}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/10"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteLink(result.id)}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-400 transition-colors rounded-md hover:bg-white/10"
                                title="Delete"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        ));
                      })()}
                    </tbody>
                    </table>

                    {/* Pagination */}
                    {filteredResults.length > itemsPerPage && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                        <div className="text-sm text-gray-300">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} results
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 glass-button border border-white/20 rounded-md text-sm text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          {/* Page numbers */}
                          {(() => {
                            const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
                            const pages = [];
                            const startPage = Math.max(1, currentPage - 2);
                            const endPage = Math.min(totalPages, currentPage + 2);
                            
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(i)}
                                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                    i === currentPage
                                      ? 'bg-blue-500 text-white'
                                      : 'glass-button border border-white/20 text-white hover:bg-white/15'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }
                            return pages;
                          })()}
                          
                          <button
                            onClick={() => setCurrentPage(Math.min(Math.ceil(filteredResults.length / itemsPerPage), currentPage + 1))}
                            disabled={currentPage === Math.ceil(filteredResults.length / itemsPerPage)}
                            className="px-3 py-1 glass-button border border-white/20 rounded-md text-sm text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* No results message */}
                {results.length > 0 ? (
                  filteredResults.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-500">
                        No links match the current filters.
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">
                      No saved links yet. Start by adding your first link above!
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Summary Section */}
          <div className="section-container p-6 lg:p-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white tracking-tight">Summary</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Active Days Card */}
              <div className="glass-card rounded-xl p-4 text-center">
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
              <div className="glass-card rounded-xl p-4 text-center">
                <div className="text-2xl font-semibold text-white mb-1">
                  {results.length}
                </div>
                <div className="text-sm text-gray-300 font-medium">Total Links</div>
                <div className="text-xs text-gray-300 mt-1">All time</div>
              </div>
              
              {/* Read Percentage Card */}
              <div className="glass-card rounded-xl p-4 text-center">
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

        {/* Debug info - 개발 중에만 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            현재 상태: {categories.length}개 카테고리, {tags.length}개 태그, {results.length}개 링크
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingLink && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="section-container max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-medium text-white">Edit Link</h3>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-300 mb-2">
                    Title
                  </label>
                  <Input
                    type="text"
                    name="title"
                    defaultValue={editingLink.title}
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-created-date" className="block text-sm font-medium text-gray-300 mb-2">
                    Created Date
                  </label>
                  <Input
                    type="date"
                    name="createdDate"
                    defaultValue={editingLink.createdAt ? new Date(editingLink.createdAt).toISOString().split('T')[0] : ''}
                    className="w-full"
                    readOnly
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    defaultValue={editingLink.category}
                    className="glass-input w-full px-3 py-2 rounded-md"
                    required
                  >
                    <option value="Technology">Technology</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Other">Other</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma separated)
                  </label>
                  <Input
                    type="text"
                    name="tags"
                    defaultValue={editingLink.tags.join(', ')}
                    placeholder="react, javascript, tutorial"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-memo" className="block text-sm font-medium text-gray-300 mb-2">
                    Memo
                  </label>
                  <textarea
                    id="edit-memo"
                    name="memo"
                    defaultValue={editingLink.memo || ''}
                    rows={3}
                    className="glass-input w-full px-3 py-2 rounded-md resize-none"
                    placeholder="Leave a personal note..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingLink(null);
                    }}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-all rounded-lg border border-white/20 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="section-container max-w-md w-full">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-medium text-white">Add New Link</h3>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const urlValue = formData.get('url') as string;
                const memoValue = formData.get('memo') as string;
                
                setUrl(urlValue);
                setMemo(memoValue);
                setShowAddModal(false);
                
                // Submit the form programmatically
                const form = document.createElement('form');
                const urlInput = document.createElement('input');
                urlInput.value = urlValue;
                const memoInput = document.createElement('input');
                memoInput.value = memoValue;
                
                form.appendChild(urlInput);
                form.appendChild(memoInput);
                
                // Create a synthetic form event
                const syntheticEvent = new Event('submit', { bubbles: true, cancelable: true }) as any;
                syntheticEvent.preventDefault = () => {};
                syntheticEvent.currentTarget = {
                  elements: {
                    url: urlInput,
                    memo: memoInput
                  }
                };
                
                handleSubmit(syntheticEvent);
              }} className="p-6 space-y-4">
                <div>
                  <label htmlFor="modal-url" className="block text-sm font-medium text-gray-300 mb-4">
                    URL Address
                  </label>
                  <Input
                    type="text"
                    name="url"
                    placeholder="https://example.com/article"
                    className="w-full"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="modal-memo" className="block text-sm font-medium text-gray-300 mb-4">
                    Personal Memo (Optional)
                  </label>
                  <textarea
                    id="modal-memo"
                    name="memo"
                    rows={3}
                    className="glass-input w-full px-3 py-2 rounded-md resize-none"
                                          placeholder="Leave a personal note about this link..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-all rounded-lg border border-white/20 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30 backdrop-blur-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* Fixed Debug Button - 개발 중에만 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
            {/* Auth Reset Button */}
            <button
              onClick={() => {
                if (confirm('인증 데이터를 정리하고 페이지를 새로고침하시겠습니까?')) {
                  forceAuthReset();
                }
              }}
                              className="px-3 py-2 bg-red-600 text-white rounded-full sds-shadow-300 hover:bg-red-700 transition-colors text-sm font-medium"
              title="인증 세션 정리 및 새로고침"
            >
                              Reset Auth
            </button>
            
            {/* Debug Button */}
            <button
            onClick={async () => {
              const debugInfo = {
                timestamp: new Date().toISOString(),
                environment: {
                  nodeEnv: process.env.NODE_ENV,
                  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'CONFIGURED' : 'NOT_CONFIGURED',
                  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
                },
                state: {
                  categories: categories.length,
                  tags: tags.length,
                  links: results.length,
                  mounted: mounted,
                },
                localStorage: {
                  categories: localStorage.getItem('linkstash-categories') ? 'EXISTS' : 'EMPTY',
                  tags: localStorage.getItem('linkstash-tags') ? 'EXISTS' : 'EMPTY',
                  links: localStorage.getItem('linkstash-links') ? 'EXISTS' : 'EMPTY',
                },
                sampleLinks: results.slice(0, 2).map(link => ({
                  id: link.id,
                  title: link.title,
                  category: link.category,
                  tags: link.tags,
                  isRead: link.isRead,
                  readAt: link.readAt?.toISOString() || null,
                  createdAt: link.createdAt.toISOString(),
                })),
                userAgent: navigator.userAgent,
                url: window.location.href,
              };

              const debugString = `
=== LinkStash Debug Information ===
Timestamp: ${debugInfo.timestamp}
URL: ${debugInfo.url}

Environment:
- Node ENV: ${debugInfo.environment.nodeEnv}
- Supabase URL: ${debugInfo.environment.supabaseUrl}
- Supabase Key: ${debugInfo.environment.supabaseKey}

Application State:
- Categories: ${debugInfo.state.categories}
- Tags: ${debugInfo.state.tags}
- Links: ${debugInfo.state.links}
 - Is Mounted: ${debugInfo.state.mounted}

LocalStorage:
- Categories: ${debugInfo.localStorage.categories}
- Tags: ${debugInfo.localStorage.tags}
- Links: ${debugInfo.localStorage.links}

Sample Links:
${debugInfo.sampleLinks.map(link => 
  `- ${link.title} (${link.category}) [Read: ${link.isRead}]`
).join('\n')}

User Agent: ${debugInfo.userAgent}

=== End Debug Information ===
              `.trim();

              try {
                await navigator.clipboard.writeText(debugString);
                alert('디버그 정보가 클립보드에 복사되었습니다!');
                console.log('Debug info copied to clipboard:', debugInfo);
              } catch (err) {
                console.error('Failed to copy to clipboard:', err);
                console.log('Debug information:', debugString);
                alert('클립보드 복사에 실패했습니다. 콘솔을 확인해주세요.');
              }
            }}
                          className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-blue-600 text-white rounded-full sds-shadow-300 hover:bg-blue-700 transition-colors text-sm font-medium"
            title="디버그 정보 복사"
                      >
              🔍 Debug
            </button>
          </div>
        )}
      </div>
    </>
  );
}

