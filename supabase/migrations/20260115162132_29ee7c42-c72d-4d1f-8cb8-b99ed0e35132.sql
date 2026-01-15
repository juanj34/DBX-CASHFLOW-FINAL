-- Delete empty draft quotes (no client, no project, no meaningful data)
-- These were created by the infinite loop bug
DELETE FROM cashflow_quotes 
WHERE status = 'draft' 
  AND client_name IS NULL 
  AND project_name IS NULL 
  AND (inputs IS NULL 
       OR inputs = '{}'::jsonb 
       OR inputs = '{"schemaVersion":1}'::jsonb
       OR NOT (inputs ? 'basePrice' AND (inputs->>'basePrice')::numeric > 0));