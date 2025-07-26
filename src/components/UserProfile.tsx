'use client';

import { useState, useEffect } from 'react';
import { UserProfile, UserStats } from '@/types';
import { database } from '@/lib/database';

interface UserProfileProps {
  userId?: string;
}

export default function UserProfileComponent({ userId }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '',
    preferences: {}
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userProfile = await database.users.getProfile(userId);
      setProfile(userProfile);
      
      if (userProfile) {
        setEditData({
          fullName: userProfile.fullName || '',
          preferences: userProfile.preferences
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      await database.users.updateProfile({
        fullName: editData.fullName || undefined,
        preferences: editData.preferences
      });
      
      setIsEditing(false);
      await loadProfile(); // Reload to get updated data
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('프로필 업데이트에 실패했습니다.');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getProgressPercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-300 h-16 w-16"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/3"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={loadProfile}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-600">
          <p>프로필을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const readingProgress = getProgressPercentage(profile.stats.readLinks, profile.stats.totalLinks);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName || profile.email}
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-2xl font-bold">
                  {(profile.fullName || profile.email).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {profile.fullName || '이름 없음'}
              </h1>
              <p className="text-blue-100">{profile.email}</p>
              <p className="text-blue-200 text-sm">
                가입일: {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
          >
            {isEditing ? '취소' : '편집'}
          </button>
        </div>

        {isEditing && (
          <div className="mt-6 space-y-4 bg-white/10 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium mb-2">이름</label>
              <input
                type="text"
                value={editData.fullName}
                onChange={(e) => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                저장
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">📊 통계 대시보드</h2>
        
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{profile.stats.totalLinks}</div>
            <div className="text-sm text-blue-800">총 링크</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{profile.stats.readLinks}</div>
            <div className="text-sm text-green-800">읽은 링크</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{profile.stats.unreadLinks}</div>
            <div className="text-sm text-orange-800">읽지 않은 링크</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{readingProgress}%</div>
            <div className="text-sm text-purple-800">읽기 진행률</div>
          </div>
        </div>

        {/* Reading Progress Bar */}
        {profile.stats.totalLinks > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">읽기 진행 상황</span>
              <span className="text-sm text-gray-500">
                {profile.stats.readLinks} / {profile.stats.totalLinks}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${readingProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{profile.stats.totalCategories}</div>
                <div className="text-sm text-gray-600">카테고리</div>
              </div>
              <div className="text-2xl">🏷️</div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">{profile.stats.totalTags}</div>
                <div className="text-sm text-gray-600">태그</div>
              </div>
              <div className="text-2xl">🔖</div>
            </div>
          </div>
        </div>

        {/* Achievement-like section */}
        {profile.stats.totalLinks === 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🚀</div>
              <div>
                <h3 className="font-medium text-yellow-800">첫 번째 링크를 추가해보세요!</h3>
                <p className="text-sm text-yellow-600">AI가 자동으로 분류해드릴게요.</p>
              </div>
            </div>
          </div>
        )}

        {profile.stats.readLinks >= 10 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🎉</div>
              <div>
                <h3 className="font-medium text-green-800">독서광 달성!</h3>
                <p className="text-sm text-green-600">10개 이상의 링크를 읽으셨네요. 대단해요!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 