-- Drop existing constraint that doesn't include working_draft
ALTER TABLE cashflow_quotes DROP CONSTRAINT IF EXISTS cashflow_quotes_status_check;

-- Add updated constraint with working_draft status
ALTER TABLE cashflow_quotes ADD CONSTRAINT cashflow_quotes_status_check 
CHECK (status = ANY (ARRAY['draft', 'presented', 'negotiating', 'sold', 'working_draft']));