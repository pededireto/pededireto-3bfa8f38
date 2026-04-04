-- Tabela principal de ofertas de emprego
CREATE TABLE public.job_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'full_time',
  salary_range TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
  slug TEXT,
  views_count INT DEFAULT 0,
  applications_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_job_offers_updated_at
  BEFORE UPDATE ON public.job_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_job_offers_active ON public.job_offers (is_active, expires_at);
CREATE INDEX idx_job_offers_business ON public.job_offers (business_id);
CREATE INDEX idx_job_offers_city ON public.job_offers (city);
CREATE INDEX idx_job_offers_slug ON public.job_offers (slug);

-- Candidaturas
CREATE TABLE public.job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_offer_id UUID REFERENCES public.job_offers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_offer_id, user_id)
);

-- Favoritos
CREATE TABLE public.job_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_offer_id UUID REFERENCES public.job_offers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_offer_id, user_id)
);

-- RLS
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_favorites ENABLE ROW LEVEL SECURITY;

-- job_offers: leitura pública (activas e não expiradas)
CREATE POLICY "Public can view active job offers"
  ON public.job_offers FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND expires_at > NOW());

-- job_offers: gestão pelo dono do negócio
CREATE POLICY "Business owner can manage own offers"
  ON public.job_offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = job_offers.business_id
        AND bu.user_id = public.get_my_profile_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = job_offers.business_id
        AND bu.user_id = public.get_my_profile_id()
    )
  );

-- job_offers: admin full access
CREATE POLICY "Admin full access job offers"
  ON public.job_offers FOR ALL
  TO authenticated
  USING (public.is_admin());

-- job_applications: utilizador gere as suas
CREATE POLICY "User manages own applications"
  ON public.job_applications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- job_applications: admin pode ver todas
CREATE POLICY "Admin view all applications"
  ON public.job_applications FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- job_favorites: utilizador gere os seus
CREATE POLICY "User manages own favorites"
  ON public.job_favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());