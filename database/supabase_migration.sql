-- ================================================
-- Supabase Migration: Add Read Status to Links
-- ================================================

-- Step 1: Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'links' 
ORDER BY ordinal_position;

-- Step 2: Add the new columns (IF NOT EXISTS prevents errors if already added)
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ NULL;

-- Step 3: Update existing records to have default values
UPDATE public.links 
SET is_read = FALSE 
WHERE is_read IS NULL;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_is_read ON public.links(is_read);
CREATE INDEX IF NOT EXISTS idx_links_read_at ON public.links(read_at DESC);

-- Step 5: Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'links' 
AND column_name IN ('is_read', 'read_at')
ORDER BY column_name;

-- Step 6: Show sample data to confirm structure
SELECT 
    id,
    title,
    category,
    is_read,
    read_at,
    created_at
FROM public.links 
LIMIT 3;

-- Step 7: Test inserting a new record with read status
-- (This is just for testing - remove if not needed)
/*
INSERT INTO public.links (
    url, 
    title, 
    category, 
    tags, 
    is_read, 
    read_at
) VALUES (
    'https://example.com/test',
    'Test Link for Read Status',
    'Technology',
    ARRAY['test', 'migration'],
    true,
    NOW()
);
*/ 