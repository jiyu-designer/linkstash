# 🗄️ LinkStash 데이터베이스 스키마 업데이트 가이드

## 🚨 **문제 상황**
```
Error: column links.user_id does not exist
Error: column categories.user_id does not exist  
Error: column tags.user_id does not exist
Error: duplicate key value violates unique constraint "categories_name_key"
Error: Key is not present in table "users"
```

## 🎯 **해결 방법**

### **1단계: Supabase SQL Editor 접속**
1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. LinkStash 프로젝트 (`ifoaupbxyrwtuluaayfz`) 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **"New query"** 클릭

### **2단계: 기본 스키마 생성 (첫 번째 실행)**
1. **파일 복사**: `database/fix_user_columns.sql` 내용 전체 복사
2. **SQL Editor에 붙여넣기**
3. **"Run"** 버튼 클릭 (또는 Ctrl/Cmd + Enter)

### **3단계: 제약 조건 및 데이터 정리 (두 번째 실행)**
1. **새 쿼리 생성**: "New query" 클릭
2. **파일 복사**: `database/fix_constraints_and_users.sql` 내용 전체 복사
3. **SQL Editor에 붙여넣기**
4. **"Run"** 버튼 클릭

### **4단계: 실행 결과 확인**
두 번째 스크립트 성공 시 다음과 같은 메시지가 표시됩니다:
```
🎉 제약 조건 수정 및 데이터 정리 완료!
✅ 유니크 제약 충돌 해결
✅ 사용자 데이터 동기화
✅ Foreign Key 제약 위반 해결
✅ 중복 데이터 정리
🚀 이제 링크 추가가 정상 작동합니다!
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

### **🔧 제약 조건 수정:**
- **기존 유니크 제약** 제거 (`categories_name_key`)
- **사용자별 유니크 제약** 생성 (`categories_name_user_id_unique`)
- **중복 데이터** 자동 정리
- **Foreign Key 위반** 해결

---

## 🧪 **테스트 방법**

### **스키마 업데이트 후:**
1. **Vercel 사이트 새로고침**
2. **Google 로그인** 실행
3. **콘솔 오류 확인** - 모든 데이터베이스 오류 사라져야 함
4. **링크 추가** 테스트
5. **카테고리/태그** 자동 생성 확인

### **예상 결과:**
- ✅ **데이터베이스 오류 해결**
- ✅ **사용자별 데이터 분리**
- ✅ **localStorage 폴백 없이 정상 동작**
- ✅ **개인화된 링크 관리**
- ✅ **유니크 제약 충돌 해결**
- ✅ **Foreign Key 오류 해결**

---

## 🔍 **문제 해결**

### **SQL 실행 오류 시:**
1. **권한 확인**: Supabase 프로젝트 Owner 권한 필요
2. **문법 오류**: 전체 스크립트를 한 번에 복사/붙여넣기
3. **순서 중요**: 반드시 `fix_user_columns.sql` → `fix_constraints_and_users.sql` 순서로 실행

### **여전히 오류 발생 시:**
1. **브라우저 캐시 삭제**
2. **하드 새로고침** (Ctrl/Cmd + Shift + R)
3. **개발자 도구**에서 네트워크 탭 확인
4. **로그아웃 후 재로그인**

---

## 📊 **마이그레이션 체크리스트**

### **기본 스키마 생성:**
- [ ] `fix_user_columns.sql` 실행 완료
- [ ] 성공 메시지 확인

### **제약 조건 수정:**
- [ ] `fix_constraints_and_users.sql` 실행 완료
- [ ] 데이터 정리 메시지 확인
- [ ] 사용자/링크/카테고리/태그 개수 확인

### **기능 테스트:**
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
- `duplicate key value violates unique constraint` 오류 해결
- `Key is not present in table "users"` 오류 해결
- localStorage 폴백 모드 탈출
- 진정한 사용자별 데이터 분리

### **🎉 새로운 기능들:**
- **개인화된 링크 모음**
- **사용자별 카테고리/태그**
- **읽음 상태 관리**
- **날짜별 읽기 캘린더**
- **충돌 없는 데이터 생성**

**이제 LinkStash가 완전한 개인화 북마크 앱으로 동작합니다!** 🎯 