-- Add hero_title and hero_subtitle settings
INSERT INTO public.site_settings (key, value) VALUES
  ('hero_title', 'Tem um problema? Nós mostramos quem resolve.'),
  ('hero_subtitle', 'Restaurantes, serviços, lojas e profissionais — tudo num só sítio.')
ON CONFLICT (key) DO NOTHING;