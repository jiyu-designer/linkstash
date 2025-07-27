'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function AuthCallbackContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔧 Auth 콜백 처리 시작');
        console.log('📍 현재 URL:', window.location.href);
        console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));

        // URL에서 인증 코드 파라미터를 확인
        const code = searchParams.get('code');
        const error_code = searchParams.get('error_code');
        const error_description = searchParams.get('error_description');

        if (error_code) {
          console.error('❌ Auth 오류:', { error_code, error_description });
          setError(error_description || 'Authentication failed');
          setLoading(false);
          return;
        }

        if (code) {
          console.log('📧 인증 코드 발견, 세션 교환 시작...');
          
          // 인증 코드를 세션으로 교환
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('❌ 세션 교환 오류:', exchangeError);
            setError(exchangeError.message);
            setLoading(false);
            return;
          }

          console.log('✅ 인증 성공:', data);
          setSuccess(true);
          
          // 잠시 성공 메시지를 보여준 후 홈페이지로 이동
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          console.log('⚠️ 인증 코드가 없음');
          setError('인증 코드가 없습니다.');
        }
      } catch (err) {
        console.error('❌ Auth 콜백 처리 중 오류:', err);
        setError('인증 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center backdrop-blur-20 bg-white/10 border border-white/20 mb-6 mx-auto">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            LinkStash
          </h1>
          <p className="text-gray-300 text-lg font-medium">
            이메일 인증 처리 중
          </p>
        </div>

        {/* Content */}
        <div className="glass-card rounded-2xl p-8 border border-white/20 text-center">
          {loading && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white mx-auto"></div>
              <p className="text-gray-300">이메일 인증을 처리하고 있습니다...</p>
            </div>
          )}

          {success && !loading && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">인증 완료!</h2>
                <p className="text-gray-300 mb-4">이메일 인증이 성공적으로 완료되었습니다.</p>
                <p className="text-sm text-gray-400">잠시 후 홈페이지로 이동합니다...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">인증 실패</h2>
                <p className="text-gray-300 mb-4">{error}</p>
                <button
                  onClick={() => router.push('/')}
                  className="glass-button px-6 py-2 rounded-lg text-white font-medium transition-all hover:bg-white/15 border border-white/30"
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-10">
              <div className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center backdrop-blur-20 bg-white/10 border border-white/20 mb-6 mx-auto">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                LinkStash
              </h1>
              <p className="text-gray-300 text-lg font-medium">
                이메일 인증 처리 중
              </p>
            </div>
            <div className="glass-card rounded-2xl p-8 border border-white/20 text-center">
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white mx-auto"></div>
                <p className="text-gray-300">로딩 중...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
} 