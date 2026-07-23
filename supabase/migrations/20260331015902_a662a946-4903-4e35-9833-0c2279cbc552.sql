
-- Create helper function to check tenant admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Update the operator policies on profiles to require admin role
DROP POLICY IF EXISTS "Operador update profiles same tenant" ON public.profiles;
CREATE POLICY "Admin update profiles same tenant"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)) AND
  tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
)
WITH CHECK (
  (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)) AND
  tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- Update user_roles policies to require admin
DROP POLICY IF EXISTS "Operador insert user_roles same tenant" ON public.user_roles;
CREATE POLICY "Admin insert user_roles same tenant"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)) AND
  user_id IN (SELECT p.id FROM public.profiles p WHERE p.tenant_id = (SELECT p2.tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid()))
);

DROP POLICY IF EXISTS "Operador delete user_roles same tenant" ON public.user_roles;
CREATE POLICY "Admin delete user_roles same tenant"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  (is_tenant_admin(auth.uid()) OR has_role(auth.uid(), 'superadmin'::app_role)) AND
  user_id IN (SELECT p.id FROM public.profiles p WHERE p.tenant_id = (SELECT p2.tenant_id FROM public.profiles p2 WHERE p2.id = auth.uid()))
);
