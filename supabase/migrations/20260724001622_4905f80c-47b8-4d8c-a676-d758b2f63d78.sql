-- MIGRATION 20260319083250_d84feeab-15d5-46e2-ac7c-63c79cd2495d.sql

-- Enum de roles
CREATE TYPE public.app_role AS ENUM ('superadmin', 'operador');

-- Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  aprovado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'operador',
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para checar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função security definer para checar se aprovado
CREATE OR REPLACE FUNCTION public.is_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND aprovado = true
  )
$$;

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operador');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies para profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Superadmins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Superadmins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- RLS Policies para user_roles
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- MIGRATION 20260319083527_7ccea121-86f8-4989-9238-82792ba940a9.sql

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
