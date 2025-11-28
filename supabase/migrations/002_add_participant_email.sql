-- Add email column to participants table
-- This migration adds optional email field for participant notifications

ALTER TABLE participants
ADD COLUMN email VARCHAR(255) DEFAULT NULL;

-- Create index for email lookups (optional but recommended for future features)
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
