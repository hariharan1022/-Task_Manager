-- Grant execute privilege on has_role function to anon and authenticated users
-- This prevents the 'permission denied for function has_role' error when public or anon queries are made.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
