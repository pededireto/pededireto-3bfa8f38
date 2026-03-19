
-- 2. Create commercial_pipeline table
CREATE TABLE public.commercial_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phase commercial_status_tipo NOT NULL DEFAULT 'nao_contactado',
  next_followup_date DATE,
  followup_note TEXT,
  visit_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

-- 3. Create commercial_proposals table
CREATE TABLE public.commercial_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  commercial_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_recommended TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  personal_message TEXT,
  html_content TEXT,
  email_to TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create commercial_checklist table
CREATE TABLE public.commercial_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  commercial_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questions_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
  objections_checked JSONB NOT NULL DEFAULT '[]'::jsonb,
  visit_result TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.commercial_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_checklist ENABLE ROW LEVEL SECURITY;

-- 6. Helper function to check if user is commercial/admin
CREATE OR REPLACE FUNCTION public.is_commercial_or_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('commercial', 'admin', 'super_admin')
  )
$$;

-- 7. RLS for commercial_pipeline
CREATE POLICY "Admins see all pipeline" ON public.commercial_pipeline
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Commercials see own pipeline" ON public.commercial_pipeline
  FOR ALL TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- 8. RLS for commercial_proposals
CREATE POLICY "Admins see all proposals" ON public.commercial_proposals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Commercials see own proposals" ON public.commercial_proposals
  FOR ALL TO authenticated
  USING (commercial_id = auth.uid())
  WITH CHECK (commercial_id = auth.uid());

-- 9. RLS for commercial_checklist
CREATE POLICY "Admins see all checklists" ON public.commercial_checklist
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Commercials see own checklists" ON public.commercial_checklist
  FOR ALL TO authenticated
  USING (commercial_id = auth.uid())
  WITH CHECK (commercial_id = auth.uid());

-- 10. CS and Onboarding read-only access to pipeline + checklist
CREATE POLICY "CS read pipeline" ON public.commercial_pipeline
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'cs'));

CREATE POLICY "Onboarding read pipeline" ON public.commercial_pipeline
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'onboarding'));

CREATE POLICY "CS read checklists" ON public.commercial_checklist
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'cs'));

CREATE POLICY "Onboarding read checklists" ON public.commercial_checklist
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'onboarding'));

-- 11. Index for performance
CREATE INDEX idx_commercial_pipeline_assigned ON public.commercial_pipeline(assigned_to);
CREATE INDEX idx_commercial_pipeline_phase ON public.commercial_pipeline(phase);
CREATE INDEX idx_commercial_proposals_business ON public.commercial_proposals(business_id);
CREATE INDEX idx_commercial_checklist_business ON public.commercial_checklist(business_id);
