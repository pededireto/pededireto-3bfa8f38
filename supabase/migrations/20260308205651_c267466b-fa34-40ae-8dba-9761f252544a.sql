INSERT INTO site_settings (key, value) VALUES
  ('hero_highlight_word', 'profissional'),
  ('platform_stats_title', 'A plataforma que liga Portugal aos melhores profissionais'),
  ('platform_stats_label_1', 'negócios registados'),
  ('platform_stats_label_2', 'categorias de serviços'),
  ('platform_stats_label_3', 'cidades cobertas'),
  ('platform_stats_label_4', 'grátis para consumidores'),
  ('how_it_works_title', 'Como funciona'),
  ('how_it_works_step1_title', 'Descreva o que precisa'),
  ('how_it_works_step1_desc', 'Escreva o serviço ou problema que tem. Canalizador, eletricista, restaurante — o que precisar.'),
  ('how_it_works_step2_title', 'Encontre profissionais'),
  ('how_it_works_step2_desc', 'Veja perfis completos, avaliações reais e contactos directos de profissionais na sua zona.'),
  ('how_it_works_step3_title', 'Contacte diretamente'),
  ('how_it_works_step3_desc', 'Ligue, envie WhatsApp ou peça orçamento — sem intermediários nem comissões.'),
  ('business_cta_title', 'É um profissional ou negócio local?'),
  ('business_cta_subtitle', 'Junte-se a {count}+ negócios já registados na Pede Direto'),
  ('business_cta_button', 'Registar o meu negócio — é grátis')
ON CONFLICT (key) DO NOTHING;