-- Check current links table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'links' 
ORDER BY ordinal_position;

-- Check if is_read and read_at columns exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'links' AND column_name = 'is_read') 
        THEN 'is_read column EXISTS' 
        ELSE 'is_read column MISSING' 
    END as is_read_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'links' AND column_name = 'read_at') 
        THEN 'read_at column EXISTS' 
        ELSE 'read_at column MISSING' 
    END as read_at_status; 