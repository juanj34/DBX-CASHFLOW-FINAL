
-- Fix projects table RLS policies - make them PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Everyone can view projects" ON public.projects;

CREATE POLICY "Admins can manage projects" 
ON public.projects 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (true);

-- Fix developers table RLS policies - make them PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage developers" ON public.developers;
DROP POLICY IF EXISTS "Everyone can view developers" ON public.developers;

CREATE POLICY "Admins can manage developers" 
ON public.developers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view developers" 
ON public.developers 
FOR SELECT 
USING (true);
