# 🗄️ LinkStash 데이터베이스 스키마 업데이트 가이드

## 🚨 **문제 상황**
```
Error: column links.user_id does not exist
Error: column categories.user_id does not exist  
Error: column tags.user_id does not exist
```

## 🎯 **해결 방법**

### **1단계: Supabase SQL Editor 접속**
1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. LinkStash 프로젝트 (`ifoaupbxyrwtuluaayfz`) 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **"New query"** 클릭

### **2단계: SQL 스크립트 실행**
1. **파일 복사**: `database/fix_user_columns.sql` 내용 전체 복사
2. **SQL Editor에 붙여넣기**
3. **"Run"** 버튼 클릭 (또는 Ctrl/Cmd + Enter)

### **3단계: 실행 결과 확인**
성공 시 다음과 같은 메시지가 표시됩니다:
```
✅ LinkStash 유저별 데이터 분리 스키마 업데이트 완료!
📋 추가된 컬럼: user_id (links, categories, tags)
🔒 Row Level Security 활성화 완료
🚀 사용자별 데이터 분리 준비 완료
```

---

## 📋 **업데이트 내용**

### **🔧 추가된 컬럼들:**
- `links.user_id` - 링크의 소유자
- `categories.user_id` - 카테고리의 소유자  
- `tags.user_id` - 태그의 소유자
- `links.is_read` - 읽음 상태
- `links.read_at` - 읽은 날짜

### **🔒 보안 설정:**
- **Row Level Security (RLS)** 활성화
- **사용자별 데이터 분리** 정책 적용
- **인증된 사용자만** 자신의 데이터 접근 가능

### **⚡ 성능 최적화:**
- 주요 컬럼에 **인덱스** 생성
- 효율적인 **쿼리 성능** 보장

### **🤖 자동화:**
- **신규 사용자** 자동 프로필 생성
- **Google 로그인** 시 사용자 정보 자동 입력

---

## 🧪 **테스트 방법**

### **스키마 업데이트 후:**
1. **Vercel 사이트 새로고침**
2. **Google 로그인** 실행
3. **콘솔 오류 확인** - `user_id does not exist` 오류 사라져야 함
4. **링크 추가** 테스트
5. **카테고리/태그** 자동 생성 확인

### **예상 결과:**
- ✅ **데이터베이스 오류 해결**
- ✅ **사용자별 데이터 분리**
- ✅ **localStorage 폴백 없이 정상 동작**
- ✅ **개인화된 링크 관리**

---

## 🔍 **문제 해결**

### **SQL 실행 오류 시:**
1. **권한 확인**: Supabase 프로젝트 Owner 권한 필요
2. **문법 오류**: 전체 스크립트를 한 번에 복사/붙여넣기
3. **기존 데이터**: 충돌 시 기존 테이블 백업 후 재시도

### **여전히 오류 발생 시:**
1. **브라우저 캐시 삭제**
2. **하드 새로고침** (Ctrl/Cmd + Shift + R)
3. **개발자 도구**에서 네트워크 탭 확인

---

## 📊 **마이그레이션 체크리스트**

- [ ] SQL 스크립트 실행 완료
- [ ] 성공 메시지 확인
- [ ] 브라우저 새로고침
- [ ] Google 로그인 테스트
- [ ] 링크 추가 기능 테스트
- [ ] 읽음 상태 변경 테스트
- [ ] 카테고리/태그 자동 생성 확인
- [ ] 콘솔 오류 없음 확인

---

## 🚀 **완료 후 기대 효과**

### **✅ 해결되는 문제들:**
- `column user_id does not exist` 오류 제거
- localStorage 폴백 모드 탈출
- 진정한 사용자별 데이터 분리

### **🎉 새로운 기능들:**
- **개인화된 링크 모음**
- **사용자별 카테고리/태그**
- **읽음 상태 관리**
- **날짜별 읽기 캘린더**

**이제 LinkStash가 완전한 개인화 북마크 앱으로 동작합니다!** 🎯 