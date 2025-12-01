-- Add verified column (boolean, default false)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Add x_handle column (text)
ALTER TABLE scans ADD COLUMN IF NOT EXISTS x_handle TEXT;

-- Update existing scans to have verified = true (optional, if you want all current scans to be verified)
UPDATE scans SET verified = true;
