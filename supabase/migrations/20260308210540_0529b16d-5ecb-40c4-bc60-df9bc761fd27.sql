-- Allow anyone to unsubscribe (set is_active = false only)
CREATE POLICY "Anyone can unsubscribe"
ON public.newsletter_subscribers
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (is_active = false);