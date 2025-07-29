-- ===================================
-- LinkStash: 특정 사용자 오늘 사용량 리셋
-- ===================================

-- 1. 특정 사용자 사용량 리셋 함수
CREATE OR REPLACE FUNCTION reset_user_today_usage(user_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_ai_limits
  SET current_usage = 0, reset_date = CURRENT_DATE, last_reset_at = NOW()
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 사용 예시:
-- SELECT reset_user_today_usage('user@example.com');

-- 3. 확인 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 특정 사용자 리셋 함수 생성 완료!';
  RAISE NOTICE '📝 사용법: SELECT reset_user_today_usage(''user@example.com'');';
END $$; 