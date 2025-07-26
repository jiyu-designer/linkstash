'use client';

import { useEffect } from 'react';

/**
 * Force clear all auth data on mount to prevent 401 errors
 */
export default function ForceClear() {
  useEffect(() => {
    const clearAll = () => {
      try {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear IndexedDB (Supabase sometimes uses this)
        if ('indexedDB' in window) {
          indexedDB.databases().then(databases => {
            databases.forEach(db => {
              if (db.name && db.name.includes('supabase')) {
                indexedDB.deleteDatabase(db.name);
              }
            });
          }).catch(() => {
            // Ignore errors
          });
        }
        
        // Clear cookies (auth related)
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('supabase') || name.includes('auth') || name.includes('sb-')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          }
        });
        
        console.log('🔄 모든 인증 데이터가 정리되었습니다.');
      } catch (error) {
        console.error('세션 정리 중 오류:', error);
      }
    };

    // Only run once on initial load
    const hasCleared = sessionStorage.getItem('force-cleared');
    if (!hasCleared) {
      clearAll();
      sessionStorage.setItem('force-cleared', 'true');
    }
  }, []);

  return null;
} 