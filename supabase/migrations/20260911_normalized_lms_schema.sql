-- =================================================================
-- Samyak Tutor LMS — Normalized Core Database Schema
-- Additive & backward-compatible with existing 64 Supabase tables
-- =================================================================

-- 1. Roles & Permissions Master Tables
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- 2. Augment user_profiles with enterprise LMS fields
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS role_name TEXT DEFAULT 'student_free',
  ADD COLUMN IF NOT EXISTS primary_program TEXT DEFAULT 'cee_medical',
  ADD COLUMN IF NOT EXISTS school_or_college TEXT,
  ADD COLUMN IF NOT EXISTS target_exam_year INT DEFAULT 2026,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 3. Live Class Attendance Tracking
CREATE TABLE IF NOT EXISTS public.live_class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id UUID REFERENCES public.live_classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Coupons & Promotions Engine
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('flat_npr', 'percentage')),
  discount_value NUMERIC NOT NULL,
  min_order_amount_npr NUMERIC DEFAULT 0,
  max_discount_npr NUMERIC,
  applicable_course_id TEXT,
  usage_limit INT DEFAULT 100,
  times_used INT DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Universal Orders & Commerce Ledger
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  batch_id UUID,
  plan_sku TEXT NOT NULL,
  gross_amount_npr NUMERIC NOT NULL,
  discount_amount_npr NUMERIC DEFAULT 0,
  net_amount_npr NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  coupon_id UUID REFERENCES public.coupons(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Central Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes_diff JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on newly established tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_class_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read policies for roles and permissions
CREATE POLICY "Public roles read" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Public permissions read" ON public.permissions FOR SELECT USING (true);

-- User self-attendance read & insert
CREATE POLICY "Users view own attendance" ON public.live_class_attendance 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users record own attendance" ON public.live_class_attendance 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User self-orders read
CREATE POLICY "Users view own orders" ON public.orders 
  FOR SELECT USING (auth.uid() = user_id);

-- Active coupons read
CREATE POLICY "Active coupons visible to authenticated users" ON public.coupons 
  FOR SELECT USING (is_active = true AND expires_at > NOW());
