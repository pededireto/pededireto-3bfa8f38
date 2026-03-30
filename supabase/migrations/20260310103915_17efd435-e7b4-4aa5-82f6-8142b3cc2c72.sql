
CREATE OR REPLACE FUNCTION public.get_business_benchmark_v2(
  p_business_id uuid,
  p_days integer DEFAULT 30,
  p_subcategory_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_start_date timestamp := now() - (p_days || ' days')::interval;
  v_business record;
  v_result json;
  v_city_pattern text;
  v_has_subcategories bool;
  v_filter_single_sub bool := p_subcategory_id IS NOT NULL;
BEGIN
  SELECT category_id, city INTO v_business FROM businesses WHERE id = p_business_id;

  v_city_pattern := '%' || LEFT(TRIM(v_business.city), 10) || '%';

  SELECT EXISTS (
    SELECT 1 FROM business_subcategories WHERE business_id = p_business_id
  ) INTO v_has_subcategories;

  SELECT json_build_object(
    'my_stats', json_build_object(
      'views',    (SELECT COUNT(*) FROM business_analytics_events WHERE business_id = p_business_id AND event_type = 'view'            AND created_at >= v_start_date),
      'clicks',   (SELECT COUNT(*) FROM business_analytics_events WHERE business_id = p_business_id AND event_type LIKE 'click%'       AND created_at >= v_start_date),
      'whatsapp', (SELECT COUNT(*) FROM business_analytics_events WHERE business_id = p_business_id AND event_type = 'click_whatsapp'  AND created_at >= v_start_date),
      'phone',    (SELECT COUNT(*) FROM business_analytics_events WHERE business_id = p_business_id AND event_type = 'click_phone'     AND created_at >= v_start_date),
      'website',  (SELECT COUNT(*) FROM business_analytics_events WHERE business_id = p_business_id AND event_type = 'click_website'   AND created_at >= v_start_date),
      'email',    (SELECT COUNT(*) FROM business_analytics_events WHERE business_id = p_business_id AND event_type = 'click_email'     AND created_at >= v_start_date)
    ),
    'ranking', json_build_object(
      'city_rank', (
        SELECT rank FROM (
          SELECT ae.business_id, RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
          FROM business_analytics_events ae
          JOIN businesses b ON b.id = ae.business_id
          WHERE b.city ILIKE v_city_pattern
            AND ae.event_type = 'view'
            AND ae.created_at >= v_start_date
            AND (
              CASE
                WHEN v_filter_single_sub THEN
                  EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
                WHEN v_has_subcategories THEN
                  EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id
                    AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
                ELSE b.category_id = v_business.category_id
              END
            )
          GROUP BY ae.business_id
        ) t WHERE business_id = p_business_id
      ),
      'city_total', (
        SELECT COUNT(DISTINCT b.id) FROM businesses b
        WHERE b.city ILIKE v_city_pattern AND b.is_active = true
          AND (CASE
            WHEN v_filter_single_sub THEN
              EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
            WHEN v_has_subcategories THEN
              EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id
                AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
            ELSE b.category_id = v_business.category_id END)
      ),
      'subcat_rank', (
        SELECT rank FROM (
          SELECT ae.business_id, RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
          FROM business_analytics_events ae
          JOIN businesses b ON b.id = ae.business_id
          WHERE ae.event_type = 'view' AND ae.created_at >= v_start_date
            AND (CASE
              WHEN v_filter_single_sub THEN
                EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
              WHEN v_has_subcategories THEN
                EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id
                  AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
              ELSE b.category_id = v_business.category_id END)
          GROUP BY ae.business_id
        ) t WHERE business_id = p_business_id
      ),
      'subcat_total', (
        SELECT COUNT(DISTINCT b.id) FROM businesses b WHERE b.is_active = true
          AND (CASE
            WHEN v_filter_single_sub THEN
              EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
            WHEN v_has_subcategories THEN
              EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id
                AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
            ELSE b.category_id = v_business.category_id END)
      )
    ),
    'category_stats', json_build_object(
      'name', (SELECT name FROM categories WHERE id = v_business.category_id),
      'total_businesses', (SELECT COUNT(*) FROM businesses WHERE category_id = v_business.category_id AND is_active = true),
      'total_views',  (SELECT COUNT(*) FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id WHERE b.category_id = v_business.category_id AND ae.event_type = 'view'      AND ae.created_at >= v_start_date),
      'total_clicks', (SELECT COUNT(*) FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id WHERE b.category_id = v_business.category_id AND ae.event_type LIKE 'click%' AND ae.created_at >= v_start_date),
      'avg_views',  (SELECT ROUND(AVG(cnt)) FROM (SELECT COUNT(*) AS cnt FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id WHERE b.category_id = v_business.category_id AND ae.event_type = 'view'      AND ae.created_at >= v_start_date GROUP BY ae.business_id) t),
      'avg_clicks', (SELECT ROUND(AVG(cnt)) FROM (SELECT COUNT(*) AS cnt FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id WHERE b.category_id = v_business.category_id AND ae.event_type LIKE 'click%' AND ae.created_at >= v_start_date GROUP BY ae.business_id) t)
    ),
    'subcategory_stats', json_build_object(
      'name', (
        CASE
          WHEN v_filter_single_sub THEN
            (SELECT s.name FROM subcategories s WHERE s.id = p_subcategory_id)
          WHEN v_has_subcategories THEN
            (SELECT s.name FROM subcategories s JOIN business_subcategories bs ON bs.subcategory_id = s.id WHERE bs.business_id = p_business_id ORDER BY bs.created_at ASC LIMIT 1)
          ELSE (SELECT name FROM categories WHERE id = v_business.category_id)
        END
      ),
      'total_businesses', (
        SELECT COUNT(DISTINCT b.id) FROM businesses b WHERE b.is_active = true
          AND (CASE
            WHEN v_filter_single_sub THEN
              EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
            WHEN v_has_subcategories THEN
              EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
            ELSE b.category_id = v_business.category_id END)
      ),
      'total_views', (
        SELECT COUNT(*) FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id
        WHERE ae.event_type = 'view' AND ae.created_at >= v_start_date
          AND (CASE
            WHEN v_filter_single_sub THEN
              EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
            WHEN v_has_subcategories THEN
              EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
            ELSE b.category_id = v_business.category_id END)
      ),
      'avg_views', (
        SELECT ROUND(AVG(cnt)) FROM (
          SELECT COUNT(*) AS cnt FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id
          WHERE ae.event_type = 'view' AND ae.created_at >= v_start_date
            AND (CASE
              WHEN v_filter_single_sub THEN
                EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
              WHEN v_has_subcategories THEN
                EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
              ELSE b.category_id = v_business.category_id END)
          GROUP BY ae.business_id
        ) t
      ),
      'avg_clicks', (
        SELECT ROUND(AVG(cnt)) FROM (
          SELECT COUNT(*) AS cnt FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id
          WHERE ae.event_type LIKE 'click%' AND ae.created_at >= v_start_date
            AND (CASE
              WHEN v_filter_single_sub THEN
                EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
              WHEN v_has_subcategories THEN
                EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
              ELSE b.category_id = v_business.category_id END)
          GROUP BY ae.business_id
        ) t
      )
    ),
    'city_stats', json_build_object(
      'city', v_business.city,
      'total_businesses', (
        SELECT COUNT(DISTINCT b.id) FROM businesses b
        WHERE b.city ILIKE v_city_pattern AND b.is_active = true
          AND (CASE
            WHEN v_filter_single_sub THEN
              EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
            WHEN v_has_subcategories THEN
              EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
            ELSE b.category_id = v_business.category_id END)
      ),
      'avg_views', (
        SELECT ROUND(AVG(cnt)) FROM (
          SELECT COUNT(*) AS cnt FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id
          WHERE b.city ILIKE v_city_pattern AND ae.event_type = 'view' AND ae.created_at >= v_start_date
            AND (CASE
              WHEN v_filter_single_sub THEN
                EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
              WHEN v_has_subcategories THEN
                EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
              ELSE b.category_id = v_business.category_id END)
          GROUP BY ae.business_id
        ) t
      ),
      'avg_clicks', (
        SELECT ROUND(AVG(cnt)) FROM (
          SELECT COUNT(*) AS cnt FROM business_analytics_events ae JOIN businesses b ON b.id = ae.business_id
          WHERE b.city ILIKE v_city_pattern AND ae.event_type LIKE 'click%' AND ae.created_at >= v_start_date
            AND (CASE
              WHEN v_filter_single_sub THEN
                EXISTS (SELECT 1 FROM business_subcategories bs2 WHERE bs2.business_id = b.id AND bs2.subcategory_id = p_subcategory_id)
              WHEN v_has_subcategories THEN
                EXISTS (SELECT 1 FROM business_subcategories bs1 WHERE bs1.business_id = p_business_id AND bs1.subcategory_id IN (SELECT bs2.subcategory_id FROM business_subcategories bs2 WHERE bs2.business_id = b.id))
              ELSE b.category_id = v_business.category_id END)
          GROUP BY ae.business_id
        ) t
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$function$;
