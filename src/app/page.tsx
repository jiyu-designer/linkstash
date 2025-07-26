'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CategorizedLink, Category, Tag } from '@/types';
import { storage } from '@/lib/storage';
import { getCurrentUser, onAuthStateChange, signInWithGoogle, signInWithKakao, type User } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { clearAuthData, forceAuthReset } from '@/lib/clear-auth';
import ReadingCalendar from '@/components/ReadingCalendar';
import AuthButton from '@/components/AuthButton';
import EmailAuthForm from '@/components/EmailAuthForm';
import AntiExtension from './anti-extension';

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
        // Clear URL hash after processing
        window.history.replaceState(null, '', window.location.pathname);
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
      console.log('🔄 Auth state changed:', currentUser?.email || 'logged out');
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
      alert('읽음 상태 변경에 실패했습니다.');
    }
  };

  // Edit link function
  const handleEditLink = (link: CategorizedLink) => {
    setEditingLink(link);
    setShowEditModal(true);
  };

  // Delete link function
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('이 링크를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await storage.deleteLink(linkId);
      // Refresh the results
      const updatedLinks = await storage.getLinks();
      setResults(updatedLinks);
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('링크 삭제에 실패했습니다.');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-600"></div>
          <p className="text-sm text-slate-500 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Show login page for unauthenticated users (only if Supabase is configured)
  if (!user && isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl mb-6 shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              LinkStash
            </h1>
            <p className="text-slate-600 text-lg font-medium">
              AI로 자동 분류하는 링크 관리 도구
            </p>
          </div>
          
          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 p-8">
            {/* Features */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-6 mb-8 border border-slate-200/50">
              <div className="flex items-center mb-4">
                <div className="w-2 h-2 bg-slate-600 rounded-full mr-3"></div>
                <h3 className="font-semibold text-slate-900 text-sm">주요 기능</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-slate-700">URL 자동 분류 및 태그 생성</span>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-slate-700">읽음 상태 관리 및 달력 뷰</span>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-slate-700">카테고리 및 태그별 정리</span>
                </div>
                <div className="flex items-start">
                  <div className="w-1 h-1 bg-slate-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-sm text-slate-700">개인 메모 및 북마크 관리</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            
            {/* Auth Buttons */}
            {!showEmailAuth ? (
              <div className="space-y-4">
                {/* Google Login Button */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 font-medium text-slate-700 group"
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
                  Google로 계속하기
                </button>

                {/* Kakao Login Button - 임시 숨김 (scope 에러 해결 중) */}
                {false && (
                  <button
                    onClick={handleKakaoSignIn}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#FEE500] border border-[#FEE500] rounded-2xl shadow-sm hover:shadow-md hover:bg-[#FDD835] focus:outline-none focus:ring-2 focus:ring-[#FEE500] transition-all duration-200 font-medium text-slate-900 group"
                  >
                    <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#000000"
                        d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.68 5.1 4.2 6.6L5.4 20.7c-.15.45.3.84.72.63L9.6 19.2c.72.12 1.56.18 2.4.18 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"
                      />
                    </svg>
                    카카오로 계속하기
                  </button>
                )}
                
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 font-medium">또는</span>
                  </div>
                </div>
                
                {/* Email Login Button */}
                <button
                  onClick={handleShowEmailAuth}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-2xl shadow-sm hover:shadow-lg hover:from-slate-700 hover:to-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 font-medium group"
                >
                  <svg className="w-5 h-5 group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  이메일로 계속하기
                </button>
              </div>
            ) : (
              <EmailAuthForm 
                onSuccess={handleEmailAuthSuccess}
                onCancel={handleCancelEmailAuth}
              />
            )}
            
            {!showEmailAuth && (
              <p className="text-xs text-slate-500 text-center mt-6 font-medium">
                개인정보 보호 정책에 따라 안전하게 보호됩니다
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
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
            <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                LinkStash
              </h1>
              <p className="text-sm text-slate-600">
                AI로 자동 분류하는 링크 관리 도구
              </p>
            </div>
          </div>
          {isSupabaseConfigured() && <AuthButton />}
        </header>

        {/* URL Input Form - 가장 위로 이동 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 p-8 mb-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-500 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">새 링크 추가</h2>
            </div>
            <p className="text-slate-600 ml-11">URL을 입력하면 AI가 자동으로 분류해드려요</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-semibold text-slate-700 mb-3">
                  URL 주소
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/article"
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white shadow-sm transition-all duration-200 placeholder:text-slate-400"
                    disabled={isLoading}
                  />
                  {isLoading && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-slate-600"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="memo" className="block text-sm font-semibold text-slate-700 mb-3">
                  개인 메모 <span className="text-slate-400 font-normal">(선택사항)</span>
                </label>
                <textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="이 링크에 대한 개인적인 메모를 남겨보세요..."
                  rows={3}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-white shadow-sm resize-none transition-all duration-200 placeholder:text-slate-400"
                  disabled={isLoading}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-2xl hover:from-slate-700 hover:to-slate-600 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-white mr-3"></div>
                    AI가 분석중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI로 분류하기
                  </span>
                )}
              </button>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-sm text-red-700 flex items-center font-medium">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.863-.833-2.633 0L4.18 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Reading Calendar Section */}
        <div className="mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-500 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reading Calendar</h2>
                <p className="text-slate-600 text-sm">날짜별로 읽은 콘텐츠를 확인하세요</p>
              </div>
            </div>
            <ReadingCalendar />
          </div>
        </div>

        {/* Links Section */}
        <div className="mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-500 rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Links</h2>
                  <p className="text-slate-600 text-sm">{results.length}개의 링크가 저장되어 있습니다</p>
                </div>
              </div>
              <div className="text-slate-500 text-sm font-medium">
                {results.filter(link => link.isRead).length} / {results.length} 읽음
              </div>
            </div>

            {/* 카테고리 및 태그 요약 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">카테고리</h3>
                  <Link
                    href="/categories"
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    관리 ({categories.length})
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${encodeURIComponent(category.name)}`}
                      className="flex items-center px-3 py-1 rounded-full text-sm hover:scale-105 transition-transform"
                      style={{ 
                        backgroundColor: category.color + '20',
                        color: category.color,
                        border: `1px solid ${category.color}40`
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      {category.name}
                    </Link>
                  ))}
                  {categories.length > 6 && (
                    <Link
                      href="/categories"
                      className="px-3 py-1 text-slate-500 text-sm hover:text-slate-700"
                    >
                      +{categories.length - 6}개 더
                    </Link>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">태그</h3>
                  <Link
                    href="/tags"
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    관리 ({tags.length})
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 8).map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/tags/${encodeURIComponent(tag.name)}`}
                      className="flex items-center px-2 py-1 rounded-full text-sm hover:scale-105 transition-transform"
                      style={{ 
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        border: `1px solid ${tag.color}40`
                      }}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                  {tags.length > 8 && (
                    <Link
                      href="/tags"
                      className="px-2 py-1 text-slate-500 text-sm hover:text-slate-700"
                    >
                      +{tags.length - 8}개 더
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Categorized Links
                </h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={results.length > 0 && results.every(result => result.isRead)}
                    onChange={async (e) => {
                      // 전체 읽음 상태 토글
                      const targetStatus = e.target.checked;
                      for (const result of results) {
                        if (result.isRead !== targetStatus) {
                          await handleToggleReadStatus(result.id);
                        }
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer mr-2"
                  />
                  <span className="text-sm text-gray-600">모두 읽음으로 표시</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        읽음
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        카테고리
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        태그
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        메모
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr key={result.id} className={`hover:bg-gray-50 ${result.isRead ? 'bg-gray-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={result.isRead}
                              onChange={() => handleToggleReadStatus(result.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            {result.readAt && (
                              <span className="ml-2 text-xs text-gray-500">
                                {result.readAt.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/categories/${encodeURIComponent(result.category)}`}
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                          >
                            {result.category}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {result.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {result.tags && result.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {result.tags.map((tag, tagIndex) => (
                                <Link
                                  key={tagIndex}
                                  href={`/tags/${encodeURIComponent(tag)}`}
                                  className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
                                >
                                  #{tag}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {result.memo ? (
                            <div className="text-sm text-gray-600 max-w-xs">
                              {result.memo}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-3">
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm font-medium transition-colors hover:text-gray-700"
                            >
                              바로가기
                              <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                            <button
                              onClick={() => handleEditLink(result)}
                              className="text-sm font-medium transition-colors hover:text-gray-700"
                            >
                              편집
                            </button>
                            <button
                              onClick={() => handleDeleteLink(result.id)}
                              className="text-sm font-medium transition-colors hover:text-gray-700"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Debug info - 개발 중에만 표시 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            현재 상태: {categories.length}개 카테고리, {tags.length}개 태그, {results.length}개 링크
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && editingLink && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">링크 편집</h3>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                    제목
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    name="title"
                    defaultValue={editingLink.title}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    id="edit-category"
                    name="category"
                    defaultValue={editingLink.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label htmlFor="edit-tags" className="block text-sm font-medium text-gray-700 mb-2">
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    id="edit-tags"
                    name="tags"
                    defaultValue={editingLink.tags.join(', ')}
                    placeholder="react, javascript, tutorial"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-memo" className="block text-sm font-medium text-gray-700 mb-2">
                    메모
                  </label>
                  <textarea
                    id="edit-memo"
                    name="memo"
                    defaultValue={editingLink.memo || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="개인적인 메모를 남겨보세요..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingLink(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    저장
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <footer className="mt-16 text-center px-6">
          <p className="text-sm text-slate-500">
            Tired of organizing bookmarks?{' '}
            <a
              href="#"
              className="text-slate-600 hover:text-slate-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              This page was built with LinkStash. Find out more.
            </a>
          </p>
        </footer>

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
              className="px-3 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors text-sm font-medium"
              title="인증 세션 정리 및 새로고침"
            >
              🔄 Reset Auth
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
            className="fixed bottom-4 right-4 z-50 px-3 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            title="디버그 정보 복사"
                      >
              🔍 Debug
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
