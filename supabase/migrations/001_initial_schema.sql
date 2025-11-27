-- Secret Santa Database Schema
-- Supabase PostgreSQL Migration

-- Create secret_santas table
CREATE TABLE IF NOT EXISTS secret_santas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_santa_id UUID NOT NULL REFERENCES secret_santas(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  access_code VARCHAR(100) NOT NULL UNIQUE,
  assigned_to_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  has_accessed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: unique name within same secret_santa
  CONSTRAINT unique_name_per_secret_santa UNIQUE (secret_santa_id, name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_secret_santa_id ON participants(secret_santa_id);
CREATE INDEX IF NOT EXISTS idx_participants_access_code ON participants(access_code);
CREATE INDEX IF NOT EXISTS idx_secret_santas_status ON secret_santas(status);
CREATE INDEX IF NOT EXISTS idx_secret_santas_name ON secret_santas(name);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE secret_santas ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since we're managing auth in app layer)
CREATE POLICY "Enable read access for all users" ON secret_santas
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON participants
  FOR SELECT USING (true);

-- Note: Write operations should be done via service role in API routes
-- No public write policies needed since admin operations use service role key
