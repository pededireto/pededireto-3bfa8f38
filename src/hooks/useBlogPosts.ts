import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STALE_TIME = 10 * 60 * 1000;

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category: string;
  tags: string[];
  author_name: string;
  author_avatar_url: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views_count: number;
  read_time_minutes: number;
  meta_title: string | null;
  meta_description: string | null;
  featured: boolean;
}

export const useBlogPosts = (category?: string) => {
  return useQuery({
    queryKey: ["blog-posts", category],
    staleTime: STALE_TIME,
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (category && category !== "todos") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });
};

export const useBlogPost = (slug: string | undefined) => {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: ["blog-post", slug, isAdmin],
    enabled: !!slug,
    staleTime: STALE_TIME,
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug!)
        .single();

      // Non-admins can only see published posts (RLS handles this)
      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost;
    },
  });
};

export const useFeaturedBlogPosts = (limit = 3) => {
  return useQuery({
    queryKey: ["blog-posts-featured", limit],
    staleTime: STALE_TIME,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, category, author_name, published_at, read_time_minutes")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as BlogPost[];
    },
  });
};

export const useAdminBlogPosts = () => {
  return useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(post as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-post"] });
    },
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};
