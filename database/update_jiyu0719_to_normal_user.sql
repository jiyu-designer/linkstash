-- ===================================
-- LinkStash: jiyu0719@kyonggi.ac.kr 사용자를 일반 유저로 변경
-- ===================================

-- 1. 기존 면제 사용자 설정 제거
UPDATE user_ai_limits 
SET is_exempt = false 
WHERE email = 'jiyu0719@kyonggi.ac.kr';

-- 2. 사용량 초기화 (일반 유저로 시작)
UPDATE user_ai_limits 
SET current_usage = 0, reset_date = CURRENT_DATE, last_reset_at = NOW()
WHERE email = 'jiyu0719@kyonggi.ac.kr';

-- 3. 확인 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ jiyu0719@kyonggi.ac.kr 사용자가 일반 유저로 변경되었습니다.';
  RAISE NOTICE '📊 일일 제한: 5회';
  RAISE NOTICE '🔄 사용량: 0/5로 초기화됨';
END $$; 