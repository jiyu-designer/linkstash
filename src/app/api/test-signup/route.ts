import { NextRequest, NextResponse } from 'next/server';
import { signUpWithEmail } from '@/lib/auth';
import { database } from '@/lib/database';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();
    
    console.log('🧪 테스트 회원가입 시작:', { email, fullName });
    
    // 회원가입 실행 (현재 비활성화됨)
    const signupResult = await signUpWithEmail(email, password, fullName);
    
    // 이 코드는 실행되지 않음 (signUpWithEmail이 에러를 던짐)
    return NextResponse.json({
      success: false,
      message: 'Email signup is currently disabled'
    });
  } catch (error) {
    console.error('🧪 테스트 회원가입 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Email signup is currently disabled. Please use Google or Kakao login.'
    }, { status: 400 });
  }
} 