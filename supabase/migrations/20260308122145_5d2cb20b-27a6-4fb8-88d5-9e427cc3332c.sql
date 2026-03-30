
-- TAREFA 3: Fix ranking trigger to use calculate_business_score
CREATE OR REPLACE FUNCTION sync_ranking_score()
RETURNS TRIGGER AS $$
DECLARE
  v_score integer;
BEGIN
  IF NEW.business_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT calculate_business_score(NEW.business_id) INTO v_score;
  
  UPDATE businesses
  SET ranking_score = v_score
  WHERE id = NEW.business_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_ranking_score ON analytics_events;

CREATE TRIGGER trg_update_ranking_score
AFTER INSERT ON analytics_events
FOR EACH ROW
EXECUTE FUNCTION sync_ranking_score();

-- TAREFA 4: Recalculate ranking on review approval
CREATE OR REPLACE FUNCTION recalc_score_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_score integer;
BEGIN
  -- Recalculate when review is approved (insert or status change)
  IF NEW.moderation_status = 'approved' AND 
     (TG_OP = 'INSERT' OR OLD.moderation_status IS DISTINCT FROM 'approved') THEN
    SELECT calculate_business_score(NEW.business_id) INTO v_score;
    
    UPDATE businesses
    SET ranking_score = v_score
    WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS recalc_ranking_on_review ON business_reviews;

CREATE TRIGGER recalc_ranking_on_review
AFTER INSERT OR UPDATE ON business_reviews
FOR EACH ROW
EXECUTE FUNCTION recalc_score_on_review();
