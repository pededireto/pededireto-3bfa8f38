
-- Table to store relationships between subcategories
CREATE TABLE public.subcategory_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  related_subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL DEFAULT 'suggestion' CHECK (relation_type IN ('suggestion', 'complement', 'alternative')),
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subcategory_id, related_subcategory_id)
);

-- Index for fast lookups
CREATE INDEX idx_subcategory_relations_subcategory_id ON public.subcategory_relations(subcategory_id);

-- Enable RLS
ALTER TABLE public.subcategory_relations ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read subcategory relations"
  ON public.subcategory_relations FOR SELECT
  USING (true);

-- Admin write via has_role
CREATE POLICY "Admins can manage subcategory relations"
  ON public.subcategory_relations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
