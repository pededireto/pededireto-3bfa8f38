
-- 1. Expand profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS address TEXT NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ NULL;

-- 2. Add plan_type to commercial_plans
ALTER TABLE public.commercial_plans
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'business';

-- 3. Create consumer_subscriptions table
CREATE TABLE IF NOT EXISTS public.consumer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.commercial_plans(id),
  status TEXT NOT NULL DEFAULT 'inactive',
  start_date DATE NULL,
  end_date DATE NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consumer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.consumer_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions" ON public.consumer_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" ON public.consumer_subscriptions
  FOR ALL USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_consumer_subscriptions_user_id ON public.consumer_subscriptions(user_id);

-- 4. Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  subcategory_id UUID NULL REFERENCES public.subcategories(id),
  description TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'novo',
  assigned_to_admin UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ NULL,
  CONSTRAINT service_requests_status_check CHECK (status IN ('novo', 'em_contacto', 'encaminhado', 'concluido', 'cancelado'))
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.service_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own requests" ON public.service_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all requests" ON public.service_requests
  FOR ALL USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_category_id ON public.service_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);

-- 5. Create request_business_matches table
CREATE TABLE IF NOT EXISTS public.request_business_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'enviado',
  responded_at TIMESTAMPTZ NULL,
  price_quote TEXT NULL,
  CONSTRAINT request_business_matches_status_check CHECK (status IN ('enviado', 'aceite', 'recusado', 'sem_resposta'))
);

ALTER TABLE public.request_business_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all matches" ON public.request_business_matches
  FOR ALL USING (is_admin());

CREATE INDEX IF NOT EXISTS idx_request_business_matches_request_id ON public.request_business_matches(request_id);
CREATE INDEX IF NOT EXISTS idx_request_business_matches_business_id ON public.request_business_matches(business_id);
CREATE INDEX IF NOT EXISTS idx_request_business_matches_request_status ON public.request_business_matches(request_id, status);

-- 6. Update handle_new_user trigger to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$function$;

-- 7. Create trigger for updated_at on new tables
CREATE TRIGGER update_consumer_subscriptions_updated_at
  BEFORE UPDATE ON public.consumer_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
