-- Add new columns for independent project location
ALTER TABLE projects ADD COLUMN name text;
ALTER TABLE projects ADD COLUMN latitude numeric;
ALTER TABLE projects ADD COLUMN longitude numeric;
ALTER TABLE projects ADD COLUMN description text;

-- Make hotspot_id nullable (for backwards compatibility with existing data)
ALTER TABLE projects ALTER COLUMN hotspot_id DROP NOT NULL;