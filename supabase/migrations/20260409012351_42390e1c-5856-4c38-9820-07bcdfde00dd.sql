
-- Tabela de orçamentos
CREATE TABLE public.business_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  notes TEXT,
  validity_days INTEGER NOT NULL DEFAULT 30,
  iva_rate NUMERIC(5,2) NOT NULL DEFAULT 23,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de itens do orçamento
CREATE TABLE public.business_quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.business_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX idx_business_quotes_business_id ON public.business_quotes(business_id);
CREATE INDEX idx_business_quote_items_quote_id ON public.business_quote_items(quote_id);

-- Trigger para updated_at
CREATE TRIGGER update_business_quotes_updated_at
  BEFORE UPDATE ON public.business_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.business_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_quote_items ENABLE ROW LEVEL SECURITY;

-- Policy: owners/managers can do everything on their quotes
CREATE POLICY "Business members can manage quotes"
  ON public.business_quotes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = business_quotes.business_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_users bu
      WHERE bu.business_id = business_quotes.business_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('owner', 'manager')
    )
  );

-- Policy: quote items follow parent quote access
CREATE POLICY "Business members can manage quote items"
  ON public.business_quote_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.business_quotes bq
      JOIN public.business_users bu ON bu.business_id = bq.business_id
      WHERE bq.id = business_quote_items.quote_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('owner', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_quotes bq
      JOIN public.business_users bu ON bu.business_id = bq.business_id
      WHERE bq.id = business_quote_items.quote_id
        AND bu.user_id = auth.uid()
        AND bu.role IN ('owner', 'manager')
    )
  );

-- Função para gerar número sequencial
CREATE OR REPLACE FUNCTION public.generate_quote_number(p_business_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CASE WHEN number ~ '^\#[0-9]+$'
      THEN CAST(SUBSTRING(number FROM 2) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM public.business_quotes
  WHERE business_id = p_business_id;

  RETURN '#' || LPAD(next_num::TEXT, 3, '0');
END;
$$;
