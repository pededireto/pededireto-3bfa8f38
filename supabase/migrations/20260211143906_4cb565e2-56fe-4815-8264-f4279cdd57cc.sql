
-- Seed initial site_settings values (skip if key already exists)
INSERT INTO public.site_settings (key, value) VALUES
  ('footer_text', 'Desenvolvido por Delivery Masters'),
  ('footer_link', 'https://deliverymasters.pt/sites-institucionais'),
  ('contacto_email', 'geral.pededireto@gmail.com'),
  ('contacto_whatsapp', '351210203862'),
  ('texto_institucional_home', 'Encontre rapidamente o contacto que resolve o seu problema. Restaurantes, serviços, lojas e profissionais — tudo num só sítio.')
ON CONFLICT (key) DO NOTHING;
