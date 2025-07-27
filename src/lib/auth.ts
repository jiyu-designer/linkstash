import { isSupabaseConfigured, supabase } from './supabase';
// import { authGuard } from './auth-guard';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
  console.log('🔧 이메일 회원가입 시작:', { email, fullName });
  console.log('🌐 현재 도메인:', window.location.origin);
  console.log('📧 이메일 리다이렉트 URL:', `${window.location.origin}/auth/callback`);
  
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

  console.log('📧 Supabase 회원가입 전체 응답:', JSON.stringify(data, null, 2));
  console.log('❌ Supabase 에러 정보:', error);
  
  if (data?.user) {
    console.log('👤 생성된 사용자 ID:', data.user.id);
    console.log('📧 사용자 이메일:', data.user.email);
    console.log('✅ 이메일 확인 상태:', data.user.email_confirmed_at ? '확인됨' : '확인 필요');
    console.log('📩 이메일 발송 여부:', data.user.confirmation_sent_at ? '발송됨' : '발송 안됨');
  }

  if (error) {
    console.error('❌ 이메일 회원가입 오류:', error);
    console.error('❌ 에러 코드:', error.status);
    console.error('❌ 에러 메시지:', error.message);
    throw error;
  }

  // 회원가입 성공 - 이메일 확인 없이 바로 로그인 처리
  if (data?.user) {
    console.log('✅ 회원가입 성공 - 이메일 확인 없이 바로 로그인 처리');
    
    // 이메일 확인 없이 바로 로그인
    if (!data?.session) {
      console.log('🔄 이메일 확인 없이 자동 로그인 시도...');
      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          console.error('❌ 자동 로그인 실패:', signInError);
          // 원래 데이터 반환 (이메일 확인 필요 상태)
          return data;
        }
        
        console.log('✅ 자동 로그인 성공');
        // 로그인된 세션 데이터 반환
        return {
          ...data,
          session: signInData.session,
          user: signInData.user || data.user
        };
      } catch (autoLoginError) {
        console.error('❌ 자동 로그인 예외:', autoLoginError);
        return data;
      }
    } else {
      console.log('✅ 회원가입과 동시에 자동 로그인 완료');
    }
  }

  return data;
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('이메일 로그인 오류:', error);
    throw error;
  }

  return data;
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  console.log('🔐 Supabase Google OAuth 요청 시작...');
  console.log('📍 Redirect URL:', window.location.origin);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('❌ Supabase OAuth 오류:', error);
    throw error;
  }

  console.log('✅ Supabase OAuth 응답:', data);

  return data;
};

/**
 * Sign in with Kakao OAuth
 */
export const signInWithKakao = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}`,
    },
  });

  if (error) {
    console.error('카카오 로그인 오류:', error);
    throw error;
  }

  return data;
};

/**
 * Resend email confirmation
 */
export const resendConfirmation = async (email: string) => {
  console.log('🔧 이메일 확인 재전송 시작:', email);
  console.log('📧 재전송 리다이렉트 URL:', `${window.location.origin}/auth/callback`);
  
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });

  console.log('📧 이메일 재전송 전체 응답:', JSON.stringify(data, null, 2));
  console.log('❌ 재전송 에러:', error);

  if (error) {
    console.error('❌ 이메일 확인 재전송 오류:', error);
    console.error('❌ 재전송 에러 코드:', error.status);
    console.error('❌ 재전송 에러 메시지:', error.message);
    throw error;
  }

  console.log('✅ 확인 이메일 재전송 완료');
  return data;
};

/**
 * Reset password
 */
export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('패스워드 리셋 오류:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
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
      console.error('사용자 세션 조회 오류:', error);
      return null;
    }

    if (!session?.user) {
      return null;
    }

    console.log('✅ 로그인된 사용자:', session.user.email);

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name || session.user.email || '',
      avatar_url: session.user.user_metadata?.avatar_url,
    };
  } catch (error) {
    console.error('getCurrentUser 예외 발생:', error);
    return null;
  }
};

/**
 * Get the current user ID (for database queries)
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.user) {
    return null;
  }

  return session.user.id;
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
      console.log('Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email || '',
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        callback(user);
      } else {
        callback(null);
      }
    } catch (error) {
      console.error('Auth state change 처리 중 오류:', error);
      callback(null);
    }
  });
}; 