/**
 * Clear all authentication-related data to fix 401 errors
 */
export const clearAuthData = () => {
  try {
    // Clear specific Supabase items
    const supabaseKeys = [
      'supabase.auth.token',
      'sb-ifoaupbxyrwtuluaayfz-auth-token',
      'supabase.auth.refreshToken',
      'supabase.auth.expiresAt',
      'supabase.auth.user',
      'sb-ifoaupbxyrwtuluaayfz-auth-token-code-verifier',
      'sb-ifoaupbxyrwtuluaayfz-auth-token-state'
    ];
    
    supabaseKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear any other auth-related items (more comprehensive)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear sessionStorage completely for auth
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
        sessionStorage.removeItem(key);
      }
    }
    
    console.log('인증 데이터가 완전히 정리되었습니다.');
  } catch (error) {
    console.error('인증 데이터 정리 중 오류:', error);
  }
};

/**
 * Force refresh the page after clearing auth data
 */
export const forceAuthReset = () => {
  clearAuthData();
  window.location.reload();
}; 