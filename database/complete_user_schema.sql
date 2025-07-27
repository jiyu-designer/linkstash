-- Complete User-based Database Schema for LinkStash
-- Run this script in Supabase SQL Editor

-- ============================================
-- 1. CREATE PUBLIC USERS TABLE
-- ============================================

-- Create public.users table to extend auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. UPDATE EXISTING TABLES WITH PROPER FOREIGN KEYS
-- ============================================

-- First, add user_id columns if they don't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE links ADD COLUMN IF NOT EXISTS user_id UUID;

-- Drop existing foreign key constraints if they exist
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_fkey;
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_user_id_fkey;
ALTER TABLE links DROP CONSTRAINT IF EXISTS links_user_id_fkey;

-- Add proper foreign key constraints to public.users
ALTER TABLE categories 
  ADD CONSTRAINT categories_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE tags 
  ADD CONSTRAINT tags_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE links 
  ADD CONSTRAINT links_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);

-- Composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_user_name ON categories(user_id, name);
CREATE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_links_user_created ON links(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_user_category ON links(user_id, category);

-- ============================================
-- 4. AUTOMATIC USER PROFILE MANAGEMENT
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    full_name = NEW.raw_user_meta_data->>'full_name',
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic user profile updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ============================================
-- 5. UPDATE RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

DROP POLICY IF EXISTS "Users can view their own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert their own tags" ON tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON tags;

DROP POLICY IF EXISTS "Users can view their own links" ON links;
DROP POLICY IF EXISTS "Users can insert their own links" ON links;
DROP POLICY IF EXISTS "Users can update their own links" ON links;
DROP POLICY IF EXISTS "Users can delete their own links" ON links;

-- Create new policies based on public.users
-- Categories policies
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (user_id = auth.uid());

-- Tags policies
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (user_id = auth.uid());

-- Links policies
CREATE POLICY "Users can view own links" ON links
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own links" ON links
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own links" ON links
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own links" ON links
  FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- 6. UTILITY FUNCTIONS
-- ============================================

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_links', COALESCE(links_count, 0),
    'read_links', COALESCE(read_count, 0),
    'unread_links', COALESCE(unread_count, 0),
    'total_categories', COALESCE(categories_count, 0),
    'total_tags', COALESCE(tags_count, 0),
    'reading_streak_days', 0  -- Can be implemented later
  ) INTO stats
  FROM (
    SELECT 
      (SELECT COUNT(*) FROM links WHERE user_id = user_uuid) as links_count,
      (SELECT COUNT(*) FROM links WHERE user_id = user_uuid AND is_read = true) as read_count,
      (SELECT COUNT(*) FROM links WHERE user_id = user_uuid AND is_read = false) as unread_count,
      (SELECT COUNT(*) FROM categories WHERE user_id = user_uuid) as categories_count,
      (SELECT COUNT(*) FROM tags WHERE user_id = user_uuid) as tags_count
  ) counts;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with stats
CREATE OR REPLACE FUNCTION get_user_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
  profile JSON;
BEGIN
  SELECT json_build_object(
    'id', u.id,
    'email', u.email,
    'full_name', u.full_name,
    'avatar_url', u.avatar_url,
    'preferences', u.preferences,
    'created_at', u.created_at,
    'updated_at', u.updated_at,
    'stats', get_user_stats(u.id)
  ) INTO profile
  FROM public.users u
  WHERE u.id = user_uuid;
  
  RETURN profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. INITIAL DATA SETUP FOR EXISTING USERS
-- ============================================

-- Create user profiles for any existing auth users
INSERT INTO public.users (id, email, full_name, avatar_url)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Update any existing data without user_id (if any exists)
-- Note: This assumes all existing data belongs to the first user
-- You might want to modify this based on your specific situation
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Get the first user ID
  SELECT id INTO first_user_id FROM public.users LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    -- Update categories without user_id
    UPDATE categories 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
    
    -- Update tags without user_id
    UPDATE tags 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
    
    -- Update links without user_id
    UPDATE links 
    SET user_id = first_user_id 
    WHERE user_id IS NULL;
  END IF;
END $$;

-- ============================================
-- 8. MAKE USER_ID REQUIRED
-- ============================================

-- After assigning user_ids, make them NOT NULL
ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tags ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE links ALTER COLUMN user_id SET NOT NULL;

-- ============================================
-- 9. GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON tags TO authenticated;
GRANT ALL ON links TO authenticated;

-- Grant access to functions
GRANT EXECUTE ON FUNCTION get_user_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;

COMMIT; 