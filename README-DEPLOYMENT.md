# 🚀 LinkStash Vercel 배포 가이드

## 📋 배포 전 준비사항

### 1. 환경 변수 확인
다음 환경 변수들이 필요합니다:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_API_KEY=your_google_gemini_api_key
```

### 2. Supabase 데이터베이스 설정
- `database/complete_user_schema.sql` 스크립트 실행 완료
- Row Level Security (RLS) 활성화 확인
- 사용자 테이블 및 정책 설정 완료

## 🌐 Vercel 배포 단계

### 1단계: GitHub 리포지토리 푸시
```bash
git add .
git commit -m "🚀 Ready for Vercel deployment"
git push origin main
```

### 2단계: Vercel 대시보드에서 프로젝트 임포트
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "New Project" 클릭
3. GitHub 리포지토리 선택 (linkstash)
4. Framework Preset: **Next.js** 선택
5. Root Directory: **linkstash** 설정

### 3단계: 환경 변수 설정
Vercel Dashboard > Project > Settings > Environment Variables에서:

#### Production 환경 변수:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anonymous Key
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_API_KEY`: Google Gemini API Key

### 4단계: OAuth 리다이렉트 URI 업데이트

#### Google OAuth Console:
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. APIs & Services > Credentials
3. OAuth 2.0 Client ID 선택
4. Authorized redirect URIs에 추가:
   ```
   https://your-vercel-domain.vercel.app
   ```

#### Supabase OAuth 설정:
1. Supabase Dashboard > Authentication > Settings
2. Site URL을 Vercel 도메인으로 업데이트:
   ```
   https://your-vercel-domain.vercel.app
   ```
3. Redirect URLs에 추가:
   ```
   https://your-vercel-domain.vercel.app/**
   ```

## 🔧 배포 후 확인사항

### 1. 기능 테스트
- [ ] 로그인/로그아웃 동작
- [ ] 링크 추가/편집/삭제
- [ ] AI 카테고리 분류
- [ ] 읽음 상태 관리
- [ ] 캘린더 뷰

### 2. 성능 확인
- [ ] 페이지 로딩 속도
- [ ] API 응답 시간
- [ ] 모바일 반응형

### 3. 보안 확인
- [ ] HTTPS 연결
- [ ] 환경 변수 노출 여부
- [ ] 인증 플로우

## 🐛 문제 해결

### 일반적인 오류들:

#### 1. "환경 변수 없음" 오류
**해결**: Vercel 대시보드에서 모든 환경 변수 재확인

#### 2. OAuth 리다이렉트 오류
**해결**: Google/Supabase에서 리다이렉트 URI 올바른지 확인

#### 3. 데이터베이스 연결 오류
**해결**: Supabase URL과 Key가 올바른지 확인

#### 4. 빌드 실패
**해결**: 
```bash
npm run build
```
로컬에서 빌드 테스트 후 오류 수정

## 📊 배포 완료 체크리스트

- [ ] Git 푸시 완료
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] OAuth 리다이렉트 URI 업데이트
- [ ] 배포 성공 확인
- [ ] 로그인 테스트
- [ ] 모든 기능 동작 확인

## 🎉 배포 성공!

배포가 완료되면 `https://your-project-name.vercel.app`에서 LinkStash에 접속할 수 있습니다.

### 다음 단계:
1. 커스텀 도메인 설정 (선택사항)
2. 성능 모니터링 설정
3. 사용자 피드백 수집 