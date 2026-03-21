CREATE OR REPLACE FUNCTION public.check_unmatched_requests()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_alerts 
    (type, title, message, severity, category, entity_type, entity_id, action_url)
  SELECT 
    'no_match',
    'Pedido sem match — ' || COALESCE(s.name, 'N/A') || COALESCE(' em ' || sr.location_city, ''),
    'Nenhum negócio foi encontrado para este pedido. Intervenção manual necessária.',
    'critical',
    'request',
    'service_request',
    sr.id,
    '/admin?tab=service-requests'
  FROM public.service_requests sr
  LEFT JOIN public.subcategories s ON s.id = sr.subcategory_id
  WHERE sr.created_at < now() - interval '15 minutes'
    AND sr.status = 'aberto'
    AND NOT EXISTS (
      SELECT 1 FROM public.request_business_matches rbm WHERE rbm.request_id = sr.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_alerts aa 
      WHERE aa.entity_type = 'service_request' AND aa.entity_id = sr.id 
        AND aa.type = 'no_match' AND aa.resolved_at IS NULL
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_unanswered_24h()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_alerts 
    (type, title, message, severity, category, entity_type, entity_id, action_url)
  SELECT 
    'unanswered_24h',
    'Pedido sem resposta 24h — ' || COALESCE(s.name, 'N/A') || COALESCE(' em ' || sr.location_city, ''),
    'Este pedido não recebeu nenhuma resposta aceite nas últimas 24 horas.',
    'important',
    'request',
    'service_request',
    sr.id,
    '/admin?tab=service-requests'
  FROM public.service_requests sr
  LEFT JOIN public.subcategories s ON s.id = sr.subcategory_id
  WHERE sr.created_at < now() - interval '24 hours'
    AND sr.status IN ('aberto', 'em_conversa')
    AND NOT EXISTS (
      SELECT 1 FROM public.request_business_matches rbm 
      WHERE rbm.request_id = sr.id AND rbm.status = 'accepted'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.admin_alerts aa 
      WHERE aa.entity_type = 'service_request' AND aa.entity_id = sr.id 
        AND aa.type = 'unanswered_24h' AND aa.resolved_at IS NULL
    );
END;
$$;