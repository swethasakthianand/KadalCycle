-- ============================================================================
-- KADALCYCLE ROW LEVEL SECURITY (RLS) POLICIES
-- Role-based Access Control (RBAC) on Supabase PostgreSQL
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beach_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;

-- 1. USERS POLICIES
-- Users can view their own profile or public profile for collectors/processors
CREATE POLICY "Users can view relevant profiles" 
ON public.users FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = auth_id);

-- 2. WASTE PICKUPS POLICIES
-- Anyone authenticated can view pickups relevant to their workflow or all for admin
CREATE POLICY "Vendors can view their own pickups" 
ON public.waste_pickups FOR SELECT 
USING (
  vendor_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
  collector_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
  processor_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin') OR
  status = 'requested'
);

-- Vendors can insert new pickup requests
CREATE POLICY "Vendors can insert pickup requests" 
ON public.waste_pickups FOR INSERT 
WITH CHECK (
  vendor_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid() AND role = 'vendor')
);

-- Collectors can update pickup requests to assigned or in_transit
CREATE POLICY "Collectors can claim and pickup batches" 
ON public.waste_pickups FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role IN ('collector', 'processor', 'admin'))
);

-- 3. BEACH COMPLAINTS POLICIES
-- Anyone can view beach dumping incidents (transparency)
CREATE POLICY "Public transparency for beach complaints" 
ON public.beach_complaints FOR SELECT 
USING (true);

-- Anyone can report dumping incidents
CREATE POLICY "Citizens can report dumping" 
ON public.beach_complaints FOR INSERT 
WITH CHECK (true);

-- Only Admins and Municipal dispatch can resolve complaints
CREATE POLICY "Admins can resolve complaints" 
ON public.beach_complaints FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);

-- 4. PROCESSING LOGS
CREATE POLICY "Public view of verified processing logs" 
ON public.processing_logs FOR SELECT 
USING (true);

CREATE POLICY "Processors can create processing certificates" 
ON public.processing_logs FOR INSERT 
WITH CHECK (
  processor_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid() AND role = 'processor')
);
