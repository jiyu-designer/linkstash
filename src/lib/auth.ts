import { supabase } from './supabase';
import { isSupabaseConfigured } from './supabase';
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      }
    }
  });

  if (error) {
    console.error('이메일 회원가입 오류:', error);
    throw error;
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
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    console.error('이메일 확인 재전송 오류:', error);
    throw error;
  }
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