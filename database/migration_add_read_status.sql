-- Migration: Add read status fields to links table
-- Run this script in your Supabase SQL Editor

-- Add the new columns to the links table
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_is_read ON links(is_read);
CREATE INDEX IF NOT EXISTS idx_links_read_at ON links(read_at DESC);

-- Update existing links to have is_read = false (default state)
UPDATE links SET is_read = FALSE WHERE is_read IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'links' 
AND column_name IN ('is_read', 'read_at'); 