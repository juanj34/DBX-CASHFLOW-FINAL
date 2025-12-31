-- Update the check constraint on cashflow_images to include hero_image
ALTER TABLE cashflow_images DROP CONSTRAINT IF EXISTS cashflow_images_image_type_check;
ALTER TABLE cashflow_images ADD CONSTRAINT cashflow_images_image_type_check 
  CHECK (image_type IN ('floor_plan', 'building_render', 'hero_image'));