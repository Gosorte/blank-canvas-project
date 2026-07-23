
-- Remover políticas públicas antigas e substituir por policies baseadas em auth

-- TENANTS
DROP POLICY IF EXISTS "Delete tenants" ON public.tenants;
DROP POLICY IF EXISTS "Escrita pública de tenants" ON public.tenants;
DROP POLICY IF EXISTS "Leitura pública de tenants" ON public.tenants;
DROP POLICY IF EXISTS "Update tenants" ON public.tenants;

CREATE POLICY "Authenticated read tenants" ON public.tenants FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));
CREATE POLICY "Superadmin insert tenants" ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin update tenants" ON public.tenants FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin delete tenants" ON public.tenants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- PLANOS
DROP POLICY IF EXISTS "Escrita pública de planos" ON public.planos;
DROP POLICY IF EXISTS "Leitura pública de planos" ON public.planos;
DROP POLICY IF EXISTS "Update planos" ON public.planos;

CREATE POLICY "Authenticated read planos" ON public.planos FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));
CREATE POLICY "Superadmin insert planos" ON public.planos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin update planos" ON public.planos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- PRODUTOS
DROP POLICY IF EXISTS "Delete produtos" ON public.produtos;
DROP POLICY IF EXISTS "Escrita pública de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Leitura pública de produtos" ON public.produtos;
DROP POLICY IF EXISTS "Update produtos" ON public.produtos;

CREATE POLICY "Authenticated read produtos" ON public.produtos FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));
CREATE POLICY "Superadmin insert produtos" ON public.produtos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin update produtos" ON public.produtos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin delete produtos" ON public.produtos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

-- MODULE_CONFIG
DROP POLICY IF EXISTS "Delete module_config" ON public.module_config;
DROP POLICY IF EXISTS "Escrita pública de module_config" ON public.module_config;
DROP POLICY IF EXISTS "Leitura pública de module_config" ON public.module_config;
DROP POLICY IF EXISTS "Update module_config" ON public.module_config;

CREATE POLICY "Authenticated read module_config" ON public.module_config FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));
CREATE POLICY "Superadmin manage module_config" ON public.module_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- INSUMOS_PRECOS
DROP POLICY IF EXISTS "Delete insumos" ON public.insumos_precos;
DROP POLICY IF EXISTS "Escrita pública de insumos" ON public.insumos_precos;
DROP POLICY IF EXISTS "Leitura pública de insumos" ON public.insumos_precos;
DROP POLICY IF EXISTS "Update insumos" ON public.insumos_precos;

CREATE POLICY "Authenticated read insumos" ON public.insumos_precos FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()));
CREATE POLICY "Superadmin manage insumos" ON public.insumos_precos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
