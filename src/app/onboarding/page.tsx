'use client';

import { Button } from '@/components/sds';
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

  const handleStartApp = async () => {
    setLoading(true);
    try {
      // 사용자 메타데이터에서 firstLogin을 false로 업데이트
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { firstLogin: false }
        });
      }
      
      router.push('/');
    } catch (error) {
      console.error('온보딩 완료 처리 오류:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "🔗 스마트한 링크 관리",
      description: "AI가 자동으로 카테고리와 태그를 생성해드립니다"
    },
    {
      title: "📅 읽기 습관 추적",
      description: "매일의 저장과 읽기 기록을 한눈에 확인하세요"
    },
    {
      title: "🚀 지금 시작해보세요",
      description: "Linkstash와 함께 체계적인 지식 관리를 시작하세요"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <h1 className="text-xl font-bold text-white">LinkStash</h1>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-400/30">
                체험하기
              </span>
            </div>
            <div className="text-sm text-gray-400">
              환영합니다! 👋
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index <= currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 transition-colors ${
                    index < currentStep ? 'bg-blue-500' : 'bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-300 text-lg">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Content Sections */}
        {currentStep === 0 && (
          <div className="grid gap-8">
            {/* Links Section */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-white mb-6">저장된 링크</h3>
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
                          <span className="w-2 h-2 bg-green-400 rounded-full" title="읽음"></span>
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
                          "{link.memo}"
                        </p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-400 pt-2">
                        <span>저장: {link.savedAt}</span>
                        {link.readAt && <span>읽음: {link.readAt}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="grid gap-8">
            {/* Calendar Section */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-semibold text-white mb-6">읽기 캘린더</h3>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">7</div>
                  <div className="text-sm text-gray-300">이번 주 저장</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">5</div>
                  <div className="text-sm text-gray-300">이번 주 읽음</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">71%</div>
                  <div className="text-sm text-gray-300">읽기 비율</div>
                </div>
              </div>

              {/* Calendar View */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">최근 7일간 활동</h4>
                <div className="space-y-3">
                  {SAMPLE_CALENDAR_DATA.map((day) => (
                    <div key={day.date} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-center">
                        <div className="text-white font-medium">
                          {new Date(day.date).toLocaleDateString('ko-KR', { 
                            month: 'long', 
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-blue-300">
                            📥 {day.saved}개 저장
                          </span>
                          <span className="text-green-300">
                            ✅ {day.read}개 읽음
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
                  <h4 className="text-lg font-medium text-white mb-2">매일 1개씩 저장하는 습관!</h4>
                  <p className="text-gray-300">꾸준한 학습으로 지식을 쌓아가고 있어요</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid gap-8">
            {/* Feature Summary */}
            <div className="glass-card p-8 text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">L</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">LinkStash와 함께 시작하세요!</h3>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="glass-card p-6">
                  <div className="text-3xl mb-3">🤖</div>
                  <h4 className="font-semibold text-white mb-2">AI 자동 분류</h4>
                  <p className="text-gray-300 text-sm">링크를 저장하면 AI가 자동으로 카테고리와 태그를 생성해드려요</p>
                </div>
                <div className="glass-card p-6">
                  <div className="text-3xl mb-3">📊</div>
                  <h4 className="font-semibold text-white mb-2">읽기 기록</h4>
                  <p className="text-gray-300 text-sm">매일 읽은 링크를 기록하고 학습 패턴을 시각화해요</p>
                </div>
                <div className="glass-card p-6">
                  <div className="text-3xl mb-3">🎯</div>
                  <h4 className="font-semibold text-white mb-2">체계적 관리</h4>
                  <p className="text-gray-300 text-sm">카테고리별, 태그별로 체계적인 지식 관리가 가능해요</p>
                </div>
              </div>

              <Button
                onPress={handleStartApp}
                isDisabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium"
              >
                {loading ? '준비 중...' : '🚀 지금 시작하기'}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center mt-12">
          <div className="flex gap-4">
            {currentStep > 0 && (
              <Button
                onPress={() => setCurrentStep(currentStep - 1)}
                variant="neutral"
                className="border-white/20 text-white hover:bg-white/10"
              >
                이전
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button
                onPress={() => setCurrentStep(currentStep + 1)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                다음
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
} 