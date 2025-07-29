import { NextRequest, NextResponse } from 'next/server';
import { signUpWithEmail } from '@/lib/auth';
import { database } from '@/lib/database';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();
    
    console.log('🧪 테스트 회원가입 시작:', { email, fullName });
    
    // 회원가입 실행
    const signupResult = await signUpWithEmail(email, password, fullName);
    
    console.log('🧪 회원가입 결과:', signupResult);
    
    if (signupResult.user) {
      // users 테이블에서 해당 사용자 조회
      try {
        const userProfile = await database.users.getProfile(signupResult.user.id);
        console.log('🧪 users 테이블 조회 결과:', userProfile);
        
        return NextResponse.json({
          success: true,
          authUser: signupResult.user,
          dbUser: userProfile,
          message: '회원가입 및 users 테이블 저장 완료'
        });
      } catch (dbError) {
        console.error('🧪 users 테이블 조회 실패:', dbError);
        
        // 직접 Supabase에서 users 테이블 조회 시도
        try {
          const { data: directUser, error: directError } = await supabase
            .from('users')
            .select('*')
            .eq('id', signupResult.user.id)
            .single();
          
          console.log('🧪 직접 users 테이블 조회 결과:', { directUser, directError });
          
          return NextResponse.json({
            success: true,
            authUser: signupResult.user,
            directUser,
            directError: directError ? directError.message : null,
            dbError: dbError instanceof Error ? dbError.message : String(dbError),
            message: '회원가입 성공했지만 RPC 조회 실패, 직접 조회 시도'
          });
        } catch (directQueryError) {
          console.error('🧪 직접 조회도 실패:', directQueryError);
          
          return NextResponse.json({
            success: true,
            authUser: signupResult.user,
            dbError: dbError instanceof Error ? dbError.message : String(dbError),
            directError: directQueryError instanceof Error ? directQueryError.message : String(directQueryError),
            message: '회원가입 성공했지만 users 테이블 조회 모두 실패'
          });
        }
      }
    } else {
      return NextResponse.json({
        success: false,
        message: '회원가입 실패'
      });
    }
  } catch (error) {
    console.error('🧪 테스트 회원가입 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: '테스트 회원가입 중 오류 발생'
    }, { status: 500 });
  }
} 