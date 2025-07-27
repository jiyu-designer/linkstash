# 🚀 Vercel 환경 변수 설정 가이드

## 📋 **설정해야 할 환경 변수**

Vercel Dashboard > Project > Settings > Environment Variables에서 다음 변수들을 설정하세요:

### **🚀 Supabase 설정 (필수)**

#### **NEXT_PUBLIC_SUPABASE_URL**
```
Value: [YOUR_SUPABASE_PROJECT_URL]
Environments: Production, Preview, Development (모두 체크)
```

#### **NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Value: [YOUR_SUPABASE_ANON_KEY]
Environments: Production, Preview, Development (모두 체크)
```

### **🔑 Google OAuth 설정 (선택사항)**

#### **NEXT_PUBLIC_GOOGLE_CLIENT_ID**
```
Value: [Google Cloud Console에서 발급받은 실제 Client ID]
Environments: Production, Preview, Development (모두 체크)
```

**Google OAuth Client ID 발급 방법:**
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. APIs & Services > Credentials
3. Create Credentials > OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URIs: `https://your-vercel-domain.vercel.app/**`

### **🤖 Google Gemini AI 설정 (선택사항)**

#### **GOOGLE_API_KEY**
```
Value: [Google AI Studio에서 발급받은 실제 API Key]
Environments: Production, Preview, Development (모두 체크)
```

**Google Gemini API Key 발급 방법:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. Create API Key 클릭
3. 발급받은 키를 복사

---

## ⚙️ **설정 단계**

### **1. Vercel Dashboard 접속**
1. [Vercel Dashboard](https://vercel.com/dashboard) 로그인
2. LinkStash 프로젝트 선택
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 선택

### **2. 환경 변수 추가**
각 변수에 대해:
1. **"Add New"** 버튼 클릭
2. **Name**: 위의 변수명 입력
3. **Value**: 해당 값 입력
4. **Environments**: Production, Preview, Development 모두 체크
5. **"Save"** 클릭

### **3. 재배포**
환경 변수 추가 후:
1. **Deployments** 탭으로 이동
2. **"Redeploy"** 버튼 클릭
3. 배포 완료 대기

---

## 🔍 **환경별 동작 방식**

### **로컬 개발 (npm run dev)**
- `.env.local` 파일의 값 사용
- Git에 커밋되지 않음
- 개발자별로 다른 설정 가능

### **Vercel 배포 (Production/Preview)**
- Vercel Dashboard의 환경 변수 사용
- 팀 전체가 같은 설정 공유
- 보안적으로 안전

---

## ✅ **설정 완료 확인**

환경 변수 설정 후 다음을 확인하세요:

1. **🌐 사이트 접속**: `https://your-project.vercel.app`
2. **🔐 로그인 테스트**: Google 로그인 동작 확인
3. **📊 기능 테스트**: 링크 추가/편집 기능 확인
4. **🤖 AI 테스트**: 자동 카테고리 분류 기능 확인

---

## 🐛 **문제 해결**

### **환경 변수가 적용되지 않는 경우:**
1. **Deployments** 탭에서 재배포
2. **Function Logs** 탭에서 오류 확인
3. 환경 변수명과 값에 오타가 없는지 확인

### **Google 로그인이 안 되는 경우:**
1. **Google Cloud Console**에서 Redirect URI 확인
2. **Supabase Dashboard**에서 Site URL 확인
3. **Client ID**가 정확한지 확인

### **AI 카테고리 분류가 안 되는 경우:**
1. **Google AI Studio**에서 API Key 확인
2. **API Key**에 권한이 있는지 확인
3. **Quota** 초과 여부 확인

---

## 🔒 **보안 주의사항**

⚠️ **중요**: 실제 API 키나 토큰을 이 문서나 Git 저장소에 직접 기록하지 마세요!

- 모든 민감한 정보는 Vercel Environment Variables에만 저장
- `.env.local` 파일은 Git에 커밋하지 않음
- API 키가 노출된 경우 즉시 새로 발급 