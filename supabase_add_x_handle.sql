-- Add x_handle column to scans table
ALTER TABLE scans ADD COLUMN IF NOT EXISTS x_handle TEXT;

-- Update existing scans to have verified = true (as requested previously)
UPDATE scans SET verified = true;
