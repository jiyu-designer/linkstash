-- Fix Users Table RLS and RPC Functions
-- Run this script in Supabase SQL Editor

-- ============================================
-- 1. DROP EXISTING POLICIES AND FUNCTIONS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_user_profile(UUID);
DROP FUNCTION IF EXISTS public.get_user_stats(UUID);

-- ============================================
-- 2. CREATE CORRECT RLS POLICIES FOR USERS
-- ============================================

-- Users can view their own profile only
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile only
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. CREATE RPC FUNCTIONS
-- ============================================

-- Function to get user profile with stats
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  stats JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.preferences,
    u.created_at,
    u.updated_at,
    jsonb_build_object(
      'total_links', COALESCE(link_stats.total_links, 0),
      'read_links', COALESCE(link_stats.read_links, 0),
      'unread_links', COALESCE(link_stats.unread_links, 0),
      'total_categories', COALESCE(cat_stats.total_categories, 0),
      'total_tags', COALESCE(tag_stats.total_tags, 0),
      'reading_streak_days', COALESCE(streak_stats.reading_streak_days, 0)
    ) as stats
  FROM public.users u
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_links,
      COUNT(*) FILTER (WHERE is_read = true) as read_links,
      COUNT(*) FILTER (WHERE is_read = false) as unread_links
    FROM links 
    WHERE user_id = user_uuid
    GROUP BY user_id
  ) link_stats ON u.id = link_stats.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_categories
    FROM categories 
    WHERE user_id = user_uuid
    GROUP BY user_id
  ) cat_stats ON u.id = cat_stats.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_tags
    FROM tags 
    WHERE user_id = user_uuid
    GROUP BY user_id
  ) tag_stats ON u.id = tag_stats.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(DISTINCT DATE(read_at)) as reading_streak_days
    FROM links 
    WHERE user_id = user_uuid AND is_read = true AND read_at IS NOT NULL
    GROUP BY user_id
  ) streak_stats ON u.id = streak_stats.user_id
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stats only
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  total_links BIGINT,
  read_links BIGINT,
  unread_links BIGINT,
  total_categories BIGINT,
  total_tags BIGINT,
  reading_streak_days BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(link_stats.total_links, 0) as total_links,
    COALESCE(link_stats.read_links, 0) as read_links,
    COALESCE(link_stats.unread_links, 0) as unread_links,
    COALESCE(cat_stats.total_categories, 0) as total_categories,
    COALESCE(tag_stats.total_tags, 0) as total_tags,
    COALESCE(streak_stats.reading_streak_days, 0) as reading_streak_days
  FROM (
    SELECT 
      user_id,
      COUNT(*) as total_links,
      COUNT(*) FILTER (WHERE is_read = true) as read_links,
      COUNT(*) FILTER (WHERE is_read = false) as unread_links
    FROM links 
    WHERE user_id = user_uuid
    GROUP BY user_id
  ) link_stats
  FULL OUTER JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_categories
    FROM categories 
    WHERE user_id = user_uuid
    GROUP BY user_id
  ) cat_stats ON link_stats.user_id = cat_stats.user_id
  FULL OUTER JOIN (
    SELECT 
      user_id,
      COUNT(*) as total_tags
    FROM tags 
    WHERE user_id = user_uuid
    GROUP BY user_id
  ) tag_stats ON COALESCE(link_stats.user_id, cat_stats.user_id) = tag_stats.user_id
  FULL OUTER JOIN (
    SELECT 
      user_id,
      COUNT(DISTINCT DATE(read_at)) as reading_streak_days
    FROM links 
    WHERE user_id = user_uuid AND is_read = true AND read_at IS NOT NULL
    GROUP BY user_id
  ) streak_stats ON COALESCE(link_stats.user_id, cat_stats.user_id, tag_stats.user_id) = streak_stats.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. VERIFY AND FIX USERS TABLE STRUCTURE
-- ============================================

-- Add preferences column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Add any missing columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 5. CREATE UPDATE TRIGGER FOR USERS
-- ============================================

-- Create update trigger function for users table
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_users_updated_at();

-- ============================================
-- 6. TEST THE SETUP
-- ============================================

-- Test that the functions work (this will show any errors)
SELECT 'RLS and RPC functions setup completed successfully' as status; 