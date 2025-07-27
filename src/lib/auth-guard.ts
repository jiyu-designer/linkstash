import { supabase } from './supabase';

/**
 * Auth Guard to prevent 401 errors
 */
class AuthGuard {
  private isInitialized = false;
  private hasValidSession = false;

  // Allow session check and return result
  async checkSessionSafely(): Promise<boolean> {
    try {
      // Only check session if we have proper environment variables
      const hasConfig = !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here' &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here'
      );

      if (!hasConfig) {
        return false;
      }

      // Safe session check with timeout
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
      ]) as any;
      
      const { data: { session }, error } = result;

      if (error) {
        console.warn('Session check error:', error);
        return false;
      }

      this.hasValidSession = !!session;
      return this.hasValidSession;

    } catch (error) {
      console.warn('Safe session check failed:', error);
      return false;
    }
  }

  // Reset guard state
  reset(): void {
    this.isInitialized = false;
    this.hasValidSession = false;
  }

  // Safe login method
  async safeSignIn(provider: 'google' | 'kakao'): Promise<any> {
    try {
      return await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error);
      throw error;
    }
  }

  // Safe logout
  async safeSignOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.reset();
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // Force reset even if signOut fails
      this.reset();
    }
  }
}

export const authGuard = new AuthGuard(); 