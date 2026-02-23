-- Migration: Fix working_draft duplication
-- Problem: No database-level constraint prevents multiple working_drafts per user.
-- Solution: Clean up duplicates, then add a partial unique index.

-- 1. Clean up existing duplicate working_drafts (keep the most recently updated one per user)
DELETE FROM cashflow_quotes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY broker_id ORDER BY updated_at DESC NULLS LAST) as rn
    FROM cashflow_quotes
    WHERE status = 'working_draft'
  ) ranked
  WHERE rn > 1
);

-- 2. Create partial unique index: at most ONE working_draft per broker
CREATE UNIQUE INDEX idx_unique_working_draft_per_broker
  ON cashflow_quotes (broker_id)
  WHERE status = 'working_draft';
