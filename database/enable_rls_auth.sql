-- Enable Row Level Security (RLS) for User-based Data Isolation
-- Run this script in Supabase SQL Editor after setting up authentication

-- 1. Add user_id column to all tables
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);

-- 3. Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for categories table
CREATE POLICY "Users can view their own categories"
ON categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
ON categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON categories FOR DELETE
USING (auth.uid() = user_id);

-- 5. Create RLS policies for tags table
CREATE POLICY "Users can view their own tags"
ON tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
ON tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON tags FOR DELETE
USING (auth.uid() = user_id);

-- 6. Create RLS policies for links table
CREATE POLICY "Users can view their own links"
ON links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own links"
ON links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links"
ON links FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links"
ON links FOR DELETE
USING (auth.uid() = user_id);

-- 7. Update existing data to have user_id (if any exists)
-- Note: This will only work if you have existing users
-- You might need to manually assign user_ids or clear existing data

-- Example: Assign all existing data to a specific user (replace 'your-user-id' with actual user ID)
-- UPDATE categories SET user_id = 'your-user-id' WHERE user_id IS NULL;
-- UPDATE tags SET user_id = 'your-user-id' WHERE user_id IS NULL;
-- UPDATE links SET user_id = 'your-user-id' WHERE user_id IS NULL;

-- 8. Make user_id NOT NULL after assigning existing data
-- ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE tags ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE links ALTER COLUMN user_id SET NOT NULL;

COMMIT; 