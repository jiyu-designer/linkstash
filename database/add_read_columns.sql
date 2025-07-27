-- Add read status columns to links table
-- Execute this in Supabase SQL Editor

-- Step 1: Add the columns
ALTER TABLE public.links 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN read_at TIMESTAMPTZ NULL;

-- Step 2: Update existing records to have default values
UPDATE public.links 
SET is_read = FALSE 
WHERE is_read IS NULL;

-- Step 3: Create indexes for performance
CREATE INDEX idx_links_is_read ON public.links(is_read);
CREATE INDEX idx_links_read_at ON public.links(read_at DESC);

-- Step 4: Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'links' 
AND column_name IN ('is_read', 'read_at')
ORDER BY column_name;

-- Step 5: Show sample data to confirm
SELECT 
    id,
    title,
    is_read,
    read_at,
    created_at
FROM public.links 
LIMIT 5; 