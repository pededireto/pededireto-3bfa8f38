
CREATE OR REPLACE FUNCTION public.recalculate_all_ranking_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_biz record;
  v_new_score integer;
BEGIN
  -- Recalculate all scores
  FOR v_biz IN SELECT id FROM businesses WHERE is_active = true LOOP
    v_new_score := calculate_business_score(v_biz.id);
    UPDATE businesses SET ranking_score = v_new_score WHERE id = v_biz.id;
  END LOOP;
  
  -- Save daily ranking snapshot
  PERFORM save_ranking_snapshots();
END;
$function$;
