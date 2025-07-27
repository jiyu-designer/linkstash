'use client';

import UserProfileComponent from '@/components/UserProfile';
import { getCurrentUser, type User } from '@/lib/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필을 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">프로필을 보려면 먼저 로그인해주세요.</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6 sm:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex items-center space-x-4 text-sm">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← 홈으로 돌아가기
            </Link>
            <span className="text-gray-500">/</span>
            <span className="text-gray-900 font-medium">프로필</span>
          </nav>
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">사용자 프로필</h1>
          <p className="text-gray-600">내 정보와 활동 통계를 확인해보세요</p>
        </div>

        {/* Profile Component */}
        <UserProfileComponent />

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/"
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">📚</div>
              <div>
                <h3 className="font-medium text-gray-900">링크 관리</h3>
                <p className="text-sm text-gray-600">새 링크 추가 및 관리</p>
              </div>
            </div>
          </Link>

          <Link
            href="/categories"
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">🏷️</div>
              <div>
                <h3 className="font-medium text-gray-900">카테고리</h3>
                <p className="text-sm text-gray-600">카테고리별 링크 보기</p>
              </div>
            </div>
          </Link>

          <Link
            href="/tags"
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center">
              <div className="text-2xl mr-3">🔖</div>
              <div>
                <h3 className="font-medium text-gray-900">태그</h3>
                <p className="text-sm text-gray-600">태그별 링크 보기</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 