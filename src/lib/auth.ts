import { supabase, isSupabaseConfigured } from './supabase';
import type { User } from '@/types';

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 이메일 회원가입 시작:', { email, fullName });
    console.log('🌐 현재 도메인:', window.location.origin);
    console.log('📧 이메일 리다이렉트 URL:', `${window.location.origin}/auth/callback`);
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
        firstLogin: true, // 신규 사용자 플래그 설정
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Supabase 회원가입 전체 응답:', JSON.stringify(data, null, 2));
    console.log('❌ Supabase 에러 정보:', error);
    
    if (data?.user) {
      console.log('👤 생성된 사용자 ID:', data.user.id);
      console.log('📧 사용자 이메일:', data.user.email);
      console.log('✅ 이메일 확인 상태:', data.user.email_confirmed_at ? '확인됨' : '확인 필요');
      console.log('📩 이메일 발송 여부:', data.user.confirmation_sent_at ? '발송됨' : '발송 안됨');
    }
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 이메일 회원가입 오류:', error);
      console.error('❌ 에러 코드:', error.status);
      console.error('❌ 에러 메시지:', error.message);
    }
    throw error;
  }

  // 회원가입 성공 - 이메일 확인 없이 바로 로그인 처리
  if (data?.user) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ 회원가입 성공 - 이메일 확인 없이 바로 로그인 처리');
    }
    
    // 이메일 확인 없이 바로 로그인
    if (!data?.session) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 이메일 확인 없이 자동 로그인 시도...');
      }
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ 자동 로그인 실패:', signInError);
            // 원래 데이터 반환 (이메일 확인 필요 상태)
            return data;
          }
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 자동 로그인 성공');
        }
        // 로그인된 세션 데이터 반환
        return {
          ...data,
          session: signInData.session,
          user: signInData.user || data.user
        };
      } catch (autoLoginError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ 자동 로그인 예외:', autoLoginError);
        }
        return data;
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 회원가입과 동시에 자동 로그인 완료');
      }
    }
  }

  return data;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 이메일 로그인 시작:', { email });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Supabase 로그인 전체 응답:', JSON.stringify(data, null, 2));
    console.log('❌ Supabase 에러 정보:', error);
    
    if (data?.user) {
      console.log('👤 로그인된 사용자 ID:', data.user.id);
      console.log('📧 사용자 이메일:', data.user.email);
      console.log('✅ 로그인 성공 여부:', data.session ? '성공' : '실패');
    }
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 이메일 로그인 오류:', error);
      console.error('❌ 에러 코드:', error.status);
      console.error('❌ 에러 메시지:', error.message);
    }
    throw error;
  }

  return data;
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Google OAuth 로그인 시작');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Google OAuth 응답:', JSON.stringify(data, null, 2));
    console.log('❌ Google OAuth 에러 정보:', error);
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Google OAuth 오류:', error);
      console.error('❌ 에러 코드:', error.status);
      console.error('❌ 에러 메시지:', error.message);
    }
    throw error;
  }

  return data;
};

/**
 * Sign in with Kakao OAuth
 */
export const signInWithKakao = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Kakao OAuth 로그인 시작');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Kakao OAuth 응답:', JSON.stringify(data, null, 2));
    console.log('❌ Kakao OAuth 에러 정보:', error);
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Kakao OAuth 오류:', error);
      console.error('❌ 에러 코드:', error.status);
      console.error('❌ 에러 메시지:', error.message);
    }
    throw error;
  }

  return data;
};

/**
 * Resend email confirmation
 */
export const resendConfirmation = async (email: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 이메일 확인 재전송 시작:', email);
    console.log('📧 재전송 리다이렉트 URL:', `${window.location.origin}/auth/callback`);
  }
  
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 이메일 재전송 전체 응답:', JSON.stringify(data, null, 2));
    console.log('❌ 재전송 에러:', error);
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 이메일 확인 재전송 오류:', error);
      console.error('❌ 재전송 에러 코드:', error.status);
      console.error('❌ 재전송 에러 메시지:', error.message);
    }
    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ 확인 이메일 재전송 완료');
  }
  return data;
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 패스워드 재설정 시작:', { email });
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 패스워드 재설정 응답:', JSON.stringify(data, null, 2));
    console.log('❌ 패스워드 재설정 에러 정보:', error);
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 패스워드 재설정 오류:', error);
      console.error('❌ 에러 코드:', error.status);
      console.error('❌ 에러 메시지:', error.message);
    }
    throw error;
  }

  return data;
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 로그아웃 시작');
  }

  const { error } = await supabase.auth.signOut();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('❌ 로그아웃 에러 정보:', error);
  }

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ 로그아웃 오류:', error);
      console.error('❌ 에러 코드:', error.status);
      console.error('❌ 에러 메시지:', error.message);
    }
    throw error;
  }

  return { success: true };
};

/**
 * Get the current user session
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check if Supabase is configured first
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('사용자 세션 조회 오류:', error);
      }
      return null;
    }

    if (!session?.user) {
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ 로그인된 사용자:', session.user.email);
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      fullName: session.user.user_metadata?.full_name || session.user.email || '',
      avatarUrl: session.user.user_metadata?.avatar_url,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getCurrentUser 예외 발생:', error);
    }
    return null;
  }
};

/**
 * Get the current user ID (for database queries)
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    // Check if Supabase is configured first
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('사용자 ID 조회 오류:', error);
      }
      return null;
    }

    if (!session?.user) {
      return null;
    }

    return session.user.id;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getCurrentUserId 예외 발생:', error);
    }
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!isSupabaseConfigured()) {
    // Return a dummy subscription for localStorage mode
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }

  return supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth state change:', event, session?.user?.id);
      }
      
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || session.user.email || '',
          avatarUrl: session.user.user_metadata?.avatar_url,
          preferences: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        callback(user);
      } else {
        callback(null);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth state change 처리 중 오류:', error);
      }
      callback(null);
    }
  });
}; 