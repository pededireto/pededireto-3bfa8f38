-- Enable RLS on business_profiles
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own business profile
CREATE POLICY "Users can view own business profile"
ON public.business_profiles
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Allow admins to view all business profiles
CREATE POLICY "Admins can view all business profiles"
ON public.business_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage all business profiles
CREATE POLICY "Admins can manage business profiles"
ON public.business_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow users to insert their own business profile
CREATE POLICY "Users can insert own business profile"
ON public.business_profiles
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Allow users to update their own business profile
CREATE POLICY "Users can update own business profile"
ON public.business_profiles
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());