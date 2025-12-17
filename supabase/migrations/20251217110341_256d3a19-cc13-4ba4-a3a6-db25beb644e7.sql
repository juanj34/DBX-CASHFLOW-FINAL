-- Expand hotspot_category enum with new categories
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'district';
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'masterplan';
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'residential';
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'waterfront';
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'retail';
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'leisure';
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'golf';
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'infrastructure';
ALTER TYPE hotspot_category ADD VALUE IF NOT EXISTS 'heritage';