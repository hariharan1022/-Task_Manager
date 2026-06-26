-- RPC to fetch approved reviews with profile data (bypasses RLS on profiles)
CREATE OR REPLACE FUNCTION public.get_reviews_with_profiles(
  p_target_type TEXT,
  p_target_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT
        r.id,
        r.user_id,
        r.target_type,
        r.target_id,
        r.rating,
        r.title,
        r.content,
        r.status,
        r.created_at,
        r.updated_at,
        json_build_object(
          'full_name', p.full_name,
          'photo_url', p.photo_url
        ) AS profiles
      FROM public.reviews r
      LEFT JOIN public.profiles p ON r.user_id = p.id
      WHERE r.target_type = p_target_type
        AND r.target_id = p_target_id
        AND r.status = 'approved'
    ) t
  );
END;
$$;

-- RPC to fetch recent approved reviews with profiles
CREATE OR REPLACE FUNCTION public.get_recent_reviews_with_profiles(
  p_limit INT DEFAULT 6
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::json)
    FROM (
      SELECT
        r.id,
        r.user_id,
        r.target_type,
        r.target_id,
        r.rating,
        r.title,
        r.content,
        r.status,
        r.created_at,
        r.updated_at,
        json_build_object(
          'full_name', p.full_name,
          'photo_url', p.photo_url
        ) AS profiles
      FROM public.reviews r
      LEFT JOIN public.profiles p ON r.user_id = p.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT p_limit
    ) t
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reviews_with_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_reviews_with_profiles TO anon, authenticated;
