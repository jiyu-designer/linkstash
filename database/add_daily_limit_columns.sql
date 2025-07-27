-- ===================================
-- LinkStash: user_ai_limits 테이블에 일일 제한 관리 컬럼 추가
-- ===================================

-- 1. 새로운 컬럼들 추가
ALTER TABLE public.user_ai_limits 
ADD COLUMN IF NOT EXISTS today_daily_limit INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS can_reset_today BOOLEAN DEFAULT true;

-- 2. 기존 데이터 업데이트 (기본값 설정)
UPDATE user_ai_limits 
SET today_daily_limit = 5, can_reset_today = true 
WHERE today_daily_limit IS NULL OR can_reset_today IS NULL;

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_ai_limits_today_daily_limit ON user_ai_limits(today_daily_limit);
CREATE INDEX IF NOT EXISTS idx_user_ai_limits_can_reset_today ON user_ai_limits(can_reset_today);

-- 4. 기존 함수들 업데이트
CREATE OR REPLACE FUNCTION get_user_ai_limit(user_email VARCHAR)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', ul.user_id,
    'email', ul.email,
    'daily_limit', ul.daily_limit,
    'today_daily_limit', ul.today_daily_limit,
    'current_usage', ul.current_usage,
    'is_exempt', ul.is_exempt,
    'can_reset_today', ul.can_reset_today,
    'reset_date', ul.reset_date,
    'can_use_ai', CASE 
      WHEN ul.is_exempt THEN true
      WHEN ul.current_usage < ul.today_daily_limit THEN true
      ELSE false
    END,
    'remaining_usage', CASE 
      WHEN ul.is_exempt THEN 999
      ELSE GREATEST(0, ul.today_daily_limit - ul.current_usage)
    END
  ) INTO result
  FROM user_ai_limits ul
  WHERE ul.email = user_email;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 사용량 증가 함수 업데이트
CREATE OR REPLACE FUNCTION increment_user_ai_usage(user_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  user_limit RECORD;
BEGIN
  -- 사용자 제한 정보 조회
  SELECT * INTO user_limit
  FROM user_ai_limits
  WHERE email = user_email;
  
  -- 사용자가 없으면 기본값으로 생성
  IF user_limit IS NULL THEN
    INSERT INTO user_ai_limits (user_id, email, daily_limit, today_daily_limit, current_usage, reset_date)
    SELECT id, user_email, 5, 5, 1, CURRENT_DATE
    FROM auth.users
    WHERE email = user_email;
    RETURN true;
  END IF;
  
  -- 면제 사용자는 제한 없음
  IF user_limit.is_exempt THEN
    RETURN true;
  END IF;
  
  -- 일일 리셋 체크
  IF user_limit.reset_date < CURRENT_DATE THEN
    UPDATE user_ai_limits
    SET current_usage = 1, reset_date = CURRENT_DATE, last_reset_at = NOW(), can_reset_today = true
    WHERE email = user_email;
    RETURN true;
  END IF;
  
  -- 사용량 제한 체크 (today_daily_limit 사용)
  IF user_limit.current_usage >= user_limit.today_daily_limit THEN
    RETURN false;
  END IF;
  
  -- 사용량 증가
  UPDATE user_ai_limits
  SET current_usage = current_usage + 1
  WHERE email = user_email;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 오늘 사용량 리셋 함수 업데이트
CREATE OR REPLACE FUNCTION reset_user_ai_usage(user_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_ai_limits
  SET current_usage = 0, reset_date = CURRENT_DATE, last_reset_at = NOW(), can_reset_today = false
  WHERE email = user_email AND can_reset_today = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 오늘 일일 제한 설정 함수
CREATE OR REPLACE FUNCTION set_today_daily_limit(user_email VARCHAR, new_limit INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_ai_limits
  SET today_daily_limit = new_limit
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 리셋 가능 상태 설정 함수
CREATE OR REPLACE FUNCTION set_can_reset_today(user_email VARCHAR, can_reset BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_ai_limits
  SET can_reset_today = can_reset
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 확인 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ user_ai_limits 테이블에 일일 제한 관리 컬럼 추가 완료!';
  RAISE NOTICE '📊 새 컬럼: today_daily_limit, can_reset_today';
  RAISE NOTICE '🔧 업데이트된 함수: get_user_ai_limit(), increment_user_ai_usage(), reset_user_ai_usage()';
  RAISE NOTICE '🆕 새 함수: set_today_daily_limit(), set_can_reset_today()';
END $$; 