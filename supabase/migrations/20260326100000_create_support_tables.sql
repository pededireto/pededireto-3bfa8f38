-- Criar tabelas de suporte
CREATE TABLE public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid,
  user_type text NOT NULL DEFAULT 'business',
  status text NOT NULL DEFAULT 'open',
  tags text[] DEFAULT '{}',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_type text NOT NULL,
  sender_name text,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

GRANT ALL PRIVILEGES ON public.support_conversations TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON public.support_messages TO anon, authenticated, service_role;

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_conversations" ON public.support_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "staff_all_conversations" ON public.support_conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'cs', 'commercial')
    )
  );

CREATE POLICY "user_own_messages" ON public.support_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.support_conversations
      WHERE id = conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "staff_all_messages" ON public.support_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'cs', 'commercial')
    )
  );

CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_last_message
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
