
-- blog_posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  cover_image_url text,
  category text NOT NULL DEFAULT 'dicas',
  tags text[] DEFAULT '{}',
  author_name text NOT NULL DEFAULT 'Equipa PedeDireto',
  author_avatar_url text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  views_count integer NOT NULL DEFAULT 0,
  read_time_minutes integer NOT NULL DEFAULT 5,
  meta_title text,
  meta_description text,
  featured boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published posts"
ON public.blog_posts FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all posts"
ON public.blog_posts FOR ALL
USING (public.is_admin());

-- RPC to increment views
CREATE OR REPLACE FUNCTION public.increment_blog_views(post_slug text)
RETURNS void
LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE blog_posts 
  SET views_count = views_count + 1
  WHERE slug = post_slug AND is_published = true;
$$;
