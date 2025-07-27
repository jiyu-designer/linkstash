# 🎯 LinkStash 사용자 AI 제한 관리 시스템 설정 가이드

## 📋 개요

이 가이드는 LinkStash에서 사용자별 AI 기능 사용량을 관리하는 시스템을 설정하는 방법을 설명합니다.

## 🗄️ 데이터베이스 테이블 구조

### `user_ai_limits` 테이블
- **user_id**: 사용자 ID (auth.users 참조)
- **email**: 사용자 이메일
- **daily_limit**: 일일 제한 (기본값: 5)
- **current_usage**: 현재 사용량
- **is_exempt**: 면제 사용자 여부
- **reset_date**: 마지막 리셋 날짜
- **last_reset_at**: 마지막 리셋 시간

## ⚙️ 설정 단계

### 1단계: Supabase SQL Editor 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. LinkStash 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **"New query"** 클릭

### 2단계: AI 제한 관리 테이블 생성
1. **파일 복사**: `database/user_ai_limits.sql` 내용 전체 복사
2. **SQL Editor에 붙여넣기**
3. **"Run"** 버튼 클릭 (또는 Ctrl/Cmd + Enter)

### 3단계: 실행 결과 확인
성공 시 다음과 같은 메시지가 표시됩니다:
```
✅ 사용자 AI 제한 관리 테이블 생성 완료!
📊 테이블: user_ai_limits
🔧 함수: get_user_ai_limit(), increment_user_ai_usage(), reset_user_ai_usage(), set_user_exempt()
🔒 RLS 정책 적용됨
```

## 🔧 관리 함수들

### 1. 사용자 AI 제한 조회
```sql
SELECT * FROM get_user_ai_limit('user@example.com');
```

### 2. 사용량 증가
```sql
SELECT increment_user_ai_usage('user@example.com');
```

### 3. 사용량 리셋
```sql
SELECT reset_user_ai_usage('user@example.com');
```

### 4. 면제 사용자 설정
```sql
SELECT set_user_exempt('user@example.com', true);
```

## 🎯 특별 설정

### jiyu0719@kyonggi.ac.kr 사용자 설정
- **면제 사용자**: 기본적으로 면제 상태로 설정됨
- **일일 리셋**: 7월 28일 한 번만 자동 리셋
- **수동 리셋**: UI에서 "Reset Today" 버튼으로 수동 리셋 가능

## 📊 사용량 표시

### 일반 사용자
```
Daily AutoStash Usage: 3/5
```

### 제한 도달 시
```
Daily AutoStash Usage: 5/5 (Basic save only)
```

### 면제 사용자
```
Unlimited Access (Exempt User)
```

## 🔒 보안 설정

### RLS (Row Level Security) 정책
- **사용자**: 자신의 제한 정보만 조회/수정 가능
- **관리자**: 모든 사용자의 제한 정보 관리 가능
- **자동 리셋**: 매일 자동으로 사용량 초기화

## 🚀 프론트엔드 연동

### 새로운 기능
1. **실시간 사용량 표시**: 데이터베이스에서 실시간 조회
2. **자동 리셋**: 매일 자동으로 사용량 초기화
3. **면제 사용자 관리**: 관리자가 면제 상태 설정 가능
4. **수동 리셋**: 특정 사용자는 수동으로 사용량 리셋 가능

### 기존 기능과의 호환성
- **Fallback 시스템**: 데이터베이스 오류 시 localStorage 사용
- **점진적 마이그레이션**: 기존 사용자 데이터 자동 마이그레이션
- **하위 호환성**: 기존 코드와 완전 호환

## 🐛 문제 해결

### 일반적인 문제들

#### 1. 테이블 생성 실패
```sql
-- UUID 확장 확인
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### 2. RLS 정책 오류
```sql
-- RLS 재설정
ALTER TABLE user_ai_limits DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_ai_limits ENABLE ROW LEVEL SECURITY;
```

#### 3. 함수 실행 오류
```sql
-- 함수 권한 확인
GRANT EXECUTE ON FUNCTION get_user_ai_limit(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_ai_usage(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_ai_usage(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_exempt(VARCHAR, BOOLEAN) TO authenticated;
```

## 📈 모니터링

### 사용량 통계 조회
```sql
-- 전체 사용자 사용량 통계
SELECT 
  COUNT(*) as total_users,
  AVG(current_usage) as avg_usage,
  SUM(CASE WHEN is_exempt THEN 1 ELSE 0 END) as exempt_users
FROM user_ai_limits;
```

### 일일 사용량 추이
```sql
-- 일별 사용량 통계
SELECT 
  reset_date,
  COUNT(*) as active_users,
  AVG(current_usage) as avg_daily_usage
FROM user_ai_limits
GROUP BY reset_date
ORDER BY reset_date DESC;
```

## ✅ 완료 체크리스트

- [ ] `user_ai_limits` 테이블 생성
- [ ] RLS 정책 설정
- [ ] 관리 함수들 생성
- [ ] 초기 데이터 삽입
- [ ] 프론트엔드 연동
- [ ] 테스트 완료

---

## 🎉 설정 완료!

이제 LinkStash에서 사용자별 AI 기능 사용량을 체계적으로 관리할 수 있습니다.

### 주요 기능
- ✅ **사용자별 일일 제한**: 기본 5회/일
- ✅ **면제 사용자 관리**: 특정 사용자 제한 해제
- ✅ **자동 리셋**: 매일 자동으로 사용량 초기화
- ✅ **수동 리셋**: 관리자가 필요시 수동 리셋
- ✅ **실시간 모니터링**: 사용량 실시간 추적
- ✅ **보안 정책**: 사용자별 데이터 분리

### 다음 단계
1. **테스트**: 실제 사용자로 테스트 진행
2. **모니터링**: 사용량 패턴 분석
3. **최적화**: 필요시 제한 조정
4. **확장**: 추가 관리 기능 개발 