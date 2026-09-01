-- ============================================================================
-- KADALCYCLE (கடல் சுழற்சி) SUPABASE POSTGRESQL SCHEMA
-- Multi-tenant Coastal Fish & Marine Plastic Waste Traceability Engine
-- ============================================================================

-- Enable PostGIS for geospatial indexing if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER ROLES ENUM
CREATE TYPE user_role AS ENUM ('vendor', 'collector', 'processor', 'resident', 'admin');
CREATE TYPE pickup_status AS ENUM ('requested', 'assigned', 'in_transit', 'delivered', 'completed', 'cancelled');
CREATE TYPE waste_class AS ENUM ('fish_waste', 'plastic', 'thermocol', 'fishing_nets', 'shell_waste', 'mixed_waste');
CREATE TYPE complaint_status AS ENUM ('pending', 'investigating', 'cleanup_dispatched', 'resolved');
CREATE TYPE complaint_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- 2. USERS TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'vendor',
    language_pref TEXT NOT NULL DEFAULT 'ta',
    harbour_id TEXT,
    points_balance INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. WASTE PICKUPS TABLE
CREATE TABLE IF NOT EXISTS public.waste_pickups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    processor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status pickup_status NOT NULL DEFAULT 'requested',
    waste_type waste_class NOT NULL,
    ai_classification_tag TEXT,
    ai_confidence NUMERIC(4,3),
    estimated_weight_kg NUMERIC(8,2) NOT NULL DEFAULT 10.00,
    actual_weight_kg NUMERIC(8,2),
    location_lat NUMERIC(9,6) NOT NULL,
    location_lng NUMERIC(9,6) NOT NULL,
    harbour_name TEXT NOT NULL,
    image_url TEXT,
    qr_code_hash TEXT UNIQUE NOT NULL,
    destination_route TEXT,
    credits_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    in_transit_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 4. BEACH COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.beach_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resident_name TEXT NOT NULL,
    resident_phone TEXT NOT NULL,
    beach_name TEXT NOT NULL,
    location_lat NUMERIC(9,6) NOT NULL,
    location_lng NUMERIC(9,6) NOT NULL,
    image_url TEXT,
    waste_category TEXT NOT NULL,
    description TEXT,
    severity complaint_severity NOT NULL DEFAULT 'medium',
    status complaint_status NOT NULL DEFAULT 'pending',
    resolution_notes TEXT,
    resolution_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 5. PROCESSING LOGS & AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pickup_id UUID NOT NULL REFERENCES public.waste_pickups(id) ON DELETE CASCADE,
    processor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    facility_name TEXT NOT NULL,
    waste_destination TEXT NOT NULL,
    purity_rating NUMERIC(5,2) DEFAULT 95.00,
    output_product TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_waste_pickups_status ON public.waste_pickups(status);
CREATE INDEX IF NOT EXISTS idx_waste_pickups_vendor ON public.waste_pickups(vendor_id);
CREATE INDEX IF NOT EXISTS idx_waste_pickups_collector ON public.waste_pickups(collector_id);
CREATE INDEX IF NOT EXISTS idx_waste_pickups_qr ON public.waste_pickups(qr_code_hash);
CREATE INDEX IF NOT EXISTS idx_beach_complaints_status ON public.beach_complaints(status);
CREATE INDEX IF NOT EXISTS idx_beach_complaints_geo ON public.beach_complaints(location_lat, location_lng);
