-- ===================================
-- LinkStash: 사용자 AI 제한 관리 테이블
-- ===================================

-- 1. 사용자 AI 제한 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_ai_limits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  daily_limit INTEGER DEFAULT 5 NOT NULL,
  current_usage INTEGER DEFAULT 0 NOT NULL,
  is_exempt BOOLEAN DEFAULT FALSE NOT NULL,
  reset_date DATE DEFAULT CURRENT_DATE NOT NULL,
  last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 각 사용자당 하나의 레코드만 허용
  UNIQUE(user_id),
  UNIQUE(email)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_ai_limits_user_id ON user_ai_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_limits_email ON user_ai_limits(email);
CREATE INDEX IF NOT EXISTS idx_user_ai_limits_reset_date ON user_ai_limits(reset_date);

-- 3. RLS 활성화
ALTER TABLE public.user_ai_limits ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성
-- 사용자는 자신의 제한 정보만 볼 수 있음
CREATE POLICY "Users can view own AI limits"
ON user_ai_limits FOR SELECT
USING (auth.uid() = user_id);

-- 사용자는 자신의 제한 정보만 업데이트할 수 있음
CREATE POLICY "Users can update own AI limits"
ON user_ai_limits FOR UPDATE
USING (auth.uid() = user_id);

-- 관리자는 모든 사용자의 제한 정보를 관리할 수 있음 (추후 관리자 기능용)
CREATE POLICY "Admin can manage all AI limits"
ON user_ai_limits FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE email = 'admin@linkstash.com'
  )
);

-- 5. 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_ai_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 트리거 생성
CREATE TRIGGER update_user_ai_limits_updated_at
  BEFORE UPDATE ON user_ai_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_limits_updated_at();

-- 7. 사용자 AI 제한 관리를 위한 함수들
CREATE OR REPLACE FUNCTION get_user_ai_limit(user_email VARCHAR)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_id', ul.user_id,
    'email', ul.email,
    'daily_limit', ul.daily_limit,
    'current_usage', ul.current_usage,
    'is_exempt', ul.is_exempt,
    'reset_date', ul.reset_date,
    'can_use_ai', CASE 
      WHEN ul.is_exempt THEN true
      WHEN ul.current_usage < ul.daily_limit THEN true
      ELSE false
    END,
    'remaining_usage', CASE 
      WHEN ul.is_exempt THEN 999
      ELSE GREATEST(0, ul.daily_limit - ul.current_usage)
    END
  ) INTO result
  FROM user_ai_limits ul
  WHERE ul.email = user_email;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 사용량 증가 함수
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
    INSERT INTO user_ai_limits (user_id, email, daily_limit, current_usage, reset_date)
    SELECT id, user_email, 5, 1, CURRENT_DATE
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
    SET current_usage = 1, reset_date = CURRENT_DATE, last_reset_at = NOW()
    WHERE email = user_email;
    RETURN true;
  END IF;
  
  -- 사용량 제한 체크
  IF user_limit.current_usage >= user_limit.daily_limit THEN
    RETURN false;
  END IF;
  
  -- 사용량 증가
  UPDATE user_ai_limits
  SET current_usage = current_usage + 1
  WHERE email = user_email;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 사용량 리셋 함수
CREATE OR REPLACE FUNCTION reset_user_ai_usage(user_email VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_ai_limits
  SET current_usage = 0, reset_date = CURRENT_DATE, last_reset_at = NOW()
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 면제 사용자 설정 함수
CREATE OR REPLACE FUNCTION set_user_exempt(user_email VARCHAR, exempt_status BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_ai_limits
  SET is_exempt = exempt_status
  WHERE email = user_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 11. 초기 데이터 삽입 (기존 사용자들을 위한 기본 설정)
  INSERT INTO user_ai_limits (user_id, email, daily_limit, current_usage, is_exempt, reset_date)
  SELECT 
    id,
    email,
    5,
    0,
    false, -- 모든 사용자를 일반 유저로 설정
    CURRENT_DATE
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM user_ai_limits)
  ON CONFLICT (user_id) DO NOTHING;

-- 12. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 사용자 AI 제한 관리 테이블 생성 완료!';
  RAISE NOTICE '📊 테이블: user_ai_limits';
  RAISE NOTICE '🔧 함수: get_user_ai_limit(), increment_user_ai_usage(), reset_user_ai_usage(), set_user_exempt()';
  RAISE NOTICE '🔒 RLS 정책 적용됨';
END $$; 