-- =============================================
-- FASE 1: TIPOS E ENUMS
-- =============================================

-- Enum para roles de utilizador
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- =============================================
-- FASE 2: TABELAS PRINCIPAIS
-- =============================================

-- Tabela de zonas/cidades
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de restaurantes
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  description TEXT,
  schedule_weekdays TEXT,
  schedule_weekend TEXT,
  delivery_zones TEXT[] DEFAULT '{}',
  cta_website TEXT,
  cta_whatsapp TEXT,
  cta_phone TEXT,
  cta_app TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de sugestões de utilizadores
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL,
  email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de perfis de utilizador
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- =============================================
-- FASE 3: ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_restaurants_zone_id ON public.restaurants(zone_id);
CREATE INDEX idx_restaurants_category ON public.restaurants(category);
CREATE INDEX idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX idx_restaurants_is_featured ON public.restaurants(is_featured);
CREATE INDEX idx_restaurants_display_order ON public.restaurants(display_order);
CREATE INDEX idx_zones_is_active ON public.zones(is_active);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- =============================================
-- FASE 4: FUNÇÕES AUXILIARES
-- =============================================

-- Função para verificar role (SECURITY DEFINER para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- FASE 5: TRIGGERS
-- =============================================

-- Trigger para updated_at em zones
CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON public.zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em restaurants
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil após signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FASE 6: ROW LEVEL SECURITY
-- =============================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ZONES: Leitura pública de zonas ativas
CREATE POLICY "Anyone can view active zones"
  ON public.zones FOR SELECT
  USING (is_active = true);

-- ZONES: Admins podem ver todas
CREATE POLICY "Admins can view all zones"
  ON public.zones FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ZONES: Admins podem criar
CREATE POLICY "Admins can create zones"
  ON public.zones FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- ZONES: Admins podem atualizar
CREATE POLICY "Admins can update zones"
  ON public.zones FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ZONES: Admins podem eliminar
CREATE POLICY "Admins can delete zones"
  ON public.zones FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- RESTAURANTS: Leitura pública de restaurantes ativos
CREATE POLICY "Anyone can view active restaurants"
  ON public.restaurants FOR SELECT
  USING (is_active = true);

-- RESTAURANTS: Admins podem ver todos
CREATE POLICY "Admins can view all restaurants"
  ON public.restaurants FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- RESTAURANTS: Admins podem criar
CREATE POLICY "Admins can create restaurants"
  ON public.restaurants FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- RESTAURANTS: Admins podem atualizar
CREATE POLICY "Admins can update restaurants"
  ON public.restaurants FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- RESTAURANTS: Admins podem eliminar
CREATE POLICY "Admins can delete restaurants"
  ON public.restaurants FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- SUGGESTIONS: Qualquer pessoa pode criar sugestões
CREATE POLICY "Anyone can create suggestions"
  ON public.suggestions FOR INSERT
  WITH CHECK (true);

-- SUGGESTIONS: Admins podem ver todas
CREATE POLICY "Admins can view suggestions"
  ON public.suggestions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- SUGGESTIONS: Admins podem eliminar
CREATE POLICY "Admins can delete suggestions"
  ON public.suggestions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- PROFILES: Utilizadores podem ver o próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- PROFILES: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- PROFILES: Utilizadores podem atualizar o próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- USER_ROLES: Utilizadores podem ver os próprios roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- USER_ROLES: Admins podem gerir roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- =============================================
-- FASE 7: DADOS INICIAIS
-- =============================================

-- Inserir zonas iniciais
INSERT INTO public.zones (name, slug) VALUES
  ('Porto', 'porto'),
  ('Lisboa', 'lisboa'),
  ('Braga', 'braga'),
  ('Coimbra', 'coimbra'),
  ('Faro', 'faro');