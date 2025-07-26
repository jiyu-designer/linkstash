# 🚀 LinkStash 사용자 기반 데이터베이스 설정 가이드

## 📋 개요

LinkStash는 이제 완전한 사용자별 데이터 분리를 지원합니다. 각 사용자는 자신만의 링크, 카테고리, 태그를 가지며, 다른 사용자의 데이터에 접근할 수 없습니다.

## 🏗️ 데이터베이스 구조

### 1. 사용자 테이블 (public.users)
- **auth.users와 1:1 연결**
- **확장된 프로필 정보 저장**
- **사용자 설정 및 통계**

### 2. 기존 테이블 업데이트
- **categories**: `user_id` 외래키 추가
- **tags**: `user_id` 외래키 추가  
- **links**: `user_id` 외래키 추가

### 3. 보안 강화
- **Row Level Security (RLS)** 완전 적용
- **사용자별 완전 격리**
- **자동 권한 검증**

## ⚙️ 설정 단계

### 1단계: Google OAuth 설정

#### Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services > Credentials** 이동
4. **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs** 클릭
5. **Application type**: Web application 선택
6. **Authorized redirect URIs**에 추가:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```

#### 카카오 개발자 센터
1. [카카오 개발자센터](https://developers.kakao.com/) 접속
2. **내 애플리케이션 > 애플리케이션 추가하기** 클릭
3. 앱 이름, 사업자명 입력하여 앱 생성
4. **앱 키** 메뉴에서 **REST API 키** 복사 (환경변수에 사용)
5. **제품 설정 > 카카오 로그인** 이동
6. **카카오 로그인 활성화** 상태를 ON으로 변경
7. **Redirect URI** 설정:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
8. **동의항목** 설정:
   - 닉네임 (필수)
   - 이메일 (선택 또는 필수)
   - 프로필 사진 (선택)

#### Supabase Authentication
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. **Authentication > Providers** 이동
3. **Google** 활성화
4. Google Console에서 받은 **Client ID**와 **Client Secret** 입력
5. **Kakao** 활성화
6. 카카오 개발자센터에서 받은 **Client ID** 입력 (REST API 키 사용)
7. **Email** 제공자 설정:
   - **Enable email provider** 체크
   - **Enable email confirmations** 체크 (권장)
   - **Secure email change** 체크 (권장)

### 2단계: 환경변수 설정

`.env.local` 파일 생성:
```bash
# Google Gemini AI API Key
GOOGLE_API_KEY=your_google_api_key_here

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Kakao OAuth Configuration
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_rest_api_key
```

### 3단계: 데이터베이스 마이그레이션

Supabase SQL Editor에서 다음 스크립트들을 **순서대로** 실행:

#### 1) 기존 데이터 마이그레이션 (필요한 경우)
```sql
-- database/supabase_migration.sql 실행
-- (읽음 상태 및 기본 RLS 설정)
```

#### 2) 완전한 사용자 기반 스키마 적용
```sql
-- database/complete_user_schema.sql 실행
-- (사용자 테이블 생성 및 완전한 RLS 설정)
```

### 4단계: 애플리케이션 테스트

1. **개발 서버 시작**:
   ```bash
   cd linkstash && npm run dev
   ```

2. **Google 로그인 테스트**:
   - `http://localhost:3000` 접속
   - "Google로 로그인" 클릭
   - 인증 완료 후 메인 페이지 접근

3. **로그인 방식 테스트**:
   - ✅ Google OAuth 로그인
   - ✅ 카카오 OAuth 로그인
   - ✅ 이메일/패스워드 로그인
   - ✅ 이메일 회원가입
   - ✅ 패스워드 재설정

4. **기능 테스트**:
   - ✅ 링크 추가/수정/삭제
   - ✅ 카테고리 및 태그 자동 생성
   - ✅ 읽음 상태 관리
   - ✅ 캘린더 뷰
   - ✅ 사용자 프로필 및 통계

## 🔒 보안 기능

### Row Level Security (RLS)
- **모든 테이블에 RLS 적용**
- **사용자별 완전 격리**
- **데이터베이스 레벨 보안**

### 다양한 인증 방식
- **Google OAuth**: 구글 계정으로 빠른 소셜 로그인
- **카카오 OAuth**: 카카오 계정으로 간편 로그인
- **이메일/패스워드**: 전통적인 계정 기반 로그인
- **회원가입**: 새 계정 생성 및 이메일 확인
- **패스워드 재설정**: 분실한 패스워드 복구

### 자동 사용자 관리
- **로그인 시 자동 프로필 생성**
- **사용자 정보 동기화**
- **계정 삭제 시 데이터 자동 정리**

### 권한 검증
- **모든 CRUD 작업에 인증 필요**
- **타인의 데이터 접근 차단**
- **API 레벨 권한 검증**

## 📊 새로운 기능

### 1. 사용자 프로필 (`/profile`)
- **개인 정보 수정**
- **활동 통계 대시보드**
- **읽기 진행률 표시**
- **성취 시스템**

### 2. 통계 대시보드
- **총 링크 수**
- **읽은/읽지 않은 링크**
- **카테고리 및 태그 수**
- **읽기 진행률**

### 3. 향상된 UI/UX
- **프로필 아바타 클릭으로 프로필 페이지 이동**
- **로그인 상태별 다른 UI**
- **아름다운 통계 시각화**

## 🗄️ 데이터베이스 함수

### 사용 가능한 함수들
```sql
-- 사용자 통계 조회
SELECT get_user_stats();

-- 사용자 프로필 조회 (통계 포함)
SELECT get_user_profile();

-- 특정 사용자 통계 조회 (관리자용)
SELECT get_user_stats('user-uuid');
```

## 🔧 문제 해결

### 일반적인 문제들

#### 1. "User must be authenticated" 오류
- **원인**: 로그인하지 않은 상태에서 API 호출
- **해결**: Google 로그인 완료 후 재시도

#### 2. "Failed to fetch user profile" 오류
- **원인**: 데이터베이스 함수가 생성되지 않음
- **해결**: `complete_user_schema.sql` 재실행

#### 3. 기존 데이터가 보이지 않음
- **원인**: 기존 데이터에 `user_id`가 없음
- **해결**: 스크립트에서 자동으로 처리됨

#### 4. RLS 정책 오류
- **원인**: 정책이 제대로 생성되지 않음
- **해결**: 
  ```sql
  -- 모든 정책 삭제 후 재생성
  DROP POLICY IF EXISTS "Users can view own categories" ON categories;
  -- ... (스크립트 재실행)
  ```

#### 5. 이메일 인증 관련 문제

#### "이메일을 발송할 수 없습니다" 오류
- **원인**: Supabase 이메일 설정 미완료
- **해결**: Supabase Dashboard > Authentication > Settings에서 이메일 설정 확인

#### "이메일 확인이 필요합니다" 오류
- **원인**: 회원가입 후 이메일 확인을 하지 않음
- **해결**: 이메일 확인 후 로그인 시도, 또는 확인 이메일 재전송

#### 패스워드 재설정 이메일이 오지 않음
- **원인**: 이메일 주소 오타 또는 스팸함 이동
- **해결**: 이메일 주소 확인 후 스팸함 체크

#### 6. 카카오 로그인 관련 문제

#### "카카오 로그인에 실패했습니다" 오류
- **원인**: 카카오 앱 설정 미완료 또는 Redirect URI 불일치
- **해결**: 카카오 개발자센터에서 설정 확인

#### 카카오 로그인 팝업이 열리지 않음
- **원인**: 브라우저 팝업 차단 또는 REST API 키 오류
- **해결**: 팝업 허용 후 환경변수의 카카오 REST API 키 확인

#### 카카오 로그인 후 정보가 없음
- **원인**: 카카오 동의항목 설정 부족
- **해결**: 카카오 개발자센터에서 닉네임, 이메일 동의항목 설정

### 디버깅 도구

#### 현재 사용자 확인
```sql
SELECT auth.uid();
```

#### 사용자 데이터 확인
```sql
SELECT * FROM public.users WHERE id = auth.uid();
```

#### RLS 정책 확인
```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 🚀 다음 단계

1. **추가 OAuth 제공자** (GitHub, Discord 등)
2. **팀/공유 기능**
3. **고급 통계 및 분석**
4. **내보내기/가져오기 기능**
5. **API 키 관리**

## 📞 지원

문제가 발생하면 다음을 확인해주세요:

1. **환경변수 설정 확인**
2. **Google OAuth 설정 확인**
3. **Supabase 데이터베이스 스크립트 실행 확인**
4. **브라우저 콘솔 에러 메시지 확인**

모든 설정이 완료되면 완전히 격리된 개인 LinkStash를 사용할 수 있습니다! 🎉 