-- ===================================
-- LinkStash: 제약 조건 수정 및 사용자 데이터 정리
-- ===================================
-- 문제 해결:
-- 1. 기존 유니크 제약과 새 제약 충돌 해결
-- 2. 사용자 테이블 데이터 정리
-- 3. Foreign Key 제약 위반 해결

-- 🔍 현재 상황 확인
DO $$
BEGIN
  RAISE NOTICE '🔍 현재 데이터베이스 상태 확인 중...';
END $$;

-- 1. 기존 유니크 제약 조건 제거 (충돌 해결)
DO $$
BEGIN
  -- categories 테이블의 기존 name 유니크 제약 제거
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'categories_name_key' AND table_name = 'categories'
  ) THEN
    ALTER TABLE public.categories DROP CONSTRAINT categories_name_key;
    RAISE NOTICE '✅ 기존 categories_name_key 제약 조건 제거 완료';
  END IF;

  -- tags 테이블의 기존 name 유니크 제약 제거 (있다면)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tags_name_key' AND table_name = 'tags'
  ) THEN
    ALTER TABLE public.tags DROP CONSTRAINT tags_name_key;
    RAISE NOTICE '✅ 기존 tags_name_key 제약 조건 제거 완료';
  END IF;
END $$;

-- 2. 현재 로그인한 사용자를 users 테이블에 추가
-- (auth.users에는 있지만 public.users에 없는 경우)
INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
  avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
  updated_at = NOW();

-- 3. 기존 데이터에 user_id 할당 (NULL인 경우)
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- 첫 번째 사용자 ID 가져오기
  SELECT id INTO first_user_id FROM public.users LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- links 테이블 업데이트
    UPDATE public.links 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
    
    -- categories 테이블 업데이트
    UPDATE public.categories 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
    
    -- tags 테이블 업데이트
    UPDATE public.tags 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
    
    RAISE NOTICE '✅ 기존 데이터에 user_id 할당 완료: %', first_user_id;
  ELSE
    RAISE NOTICE '⚠️ 사용자가 없어서 기존 데이터 업데이트를 건너뜀';
  END IF;
END $$;

-- 4. 중복 카테고리/태그 정리
-- 같은 사용자의 중복 카테고리 제거
WITH duplicate_categories AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY name, user_id ORDER BY created_at) as rn
  FROM public.categories
  WHERE user_id IS NOT NULL
)
DELETE FROM public.categories 
WHERE id IN (
  SELECT id FROM duplicate_categories WHERE rn > 1
);

-- 같은 사용자의 중복 태그 제거
WITH duplicate_tags AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY name, user_id ORDER BY created_at) as rn
  FROM public.tags
  WHERE user_id IS NOT NULL
)
DELETE FROM public.tags 
WHERE id IN (
  SELECT id FROM duplicate_tags WHERE rn > 1
);

-- 5. user_id를 NOT NULL로 설정 (데이터 정리 후)
DO $$
BEGIN
  -- links 테이블 user_id NOT NULL 설정
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'links' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.links ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ links.user_id를 NOT NULL로 설정';
  END IF;

  -- categories 테이블 user_id NOT NULL 설정
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.categories ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ categories.user_id를 NOT NULL로 설정';
  END IF;

  -- tags 테이블 user_id NOT NULL 설정
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tags' AND column_name = 'user_id' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.tags ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE '✅ tags.user_id를 NOT NULL로 설정';
  END IF;
END $$;

-- 6. 새로운 유니크 제약 조건 재생성 (사용자별)
DO $$
BEGIN
  -- categories 테이블 유니크 제약
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'categories_name_user_id_unique'
  ) THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_name_user_id_unique UNIQUE (name, user_id);
    RAISE NOTICE '✅ categories_name_user_id_unique 제약 조건 생성';
  END IF;

  -- tags 테이블 유니크 제약
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tags_name_user_id_unique'
  ) THEN
    ALTER TABLE public.tags ADD CONSTRAINT tags_name_user_id_unique UNIQUE (name, user_id);
    RAISE NOTICE '✅ tags_name_user_id_unique 제약 조건 생성';
  END IF;
END $$;

-- 7. 통계 정보 출력
DO $$
DECLARE
  user_count INTEGER;
  link_count INTEGER;
  category_count INTEGER;
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  SELECT COUNT(*) INTO link_count FROM public.links;
  SELECT COUNT(*) INTO category_count FROM public.categories;
  SELECT COUNT(*) INTO tag_count FROM public.tags;
  
  RAISE NOTICE '📊 데이터베이스 현황:';
  RAISE NOTICE '👥 사용자: % 명', user_count;
  RAISE NOTICE '🔗 링크: % 개', link_count;
  RAISE NOTICE '📁 카테고리: % 개', category_count;
  RAISE NOTICE '🏷️ 태그: % 개', tag_count;
END $$;

-- ===================================
-- 완료 메시지
-- ===================================
DO $$
BEGIN
  RAISE NOTICE '🎉 제약 조건 수정 및 데이터 정리 완료!';
  RAISE NOTICE '✅ 유니크 제약 충돌 해결';
  RAISE NOTICE '✅ 사용자 데이터 동기화';
  RAISE NOTICE '✅ Foreign Key 제약 위반 해결';
  RAISE NOTICE '✅ 중복 데이터 정리';
  RAISE NOTICE '🚀 이제 링크 추가가 정상 작동합니다!';
END $$; 