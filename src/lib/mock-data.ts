export interface Tenant {
  id: string;
  nome_grafica: string;
  plano: string;
  status: "ativo" | "inadimplente" | "trial" | "suspenso";
  dominio: string;
  created_at: string;
  pedidos_mes: number;
  gmv_mes: number;
}

export const mockTenants: Tenant[] = [
  {
    id: "1",
    nome_grafica: "Gráfica Silva",
    plano: "Ouro",
    status: "ativo",
    dominio: "loja.graficasilva.com.br",
    created_at: "2025-01-15",
    pedidos_mes: 342,
    gmv_mes: 45200,
  },
  {
    id: "2",
    nome_grafica: "Print Express",
    plano: "Prata",
    status: "ativo",
    dominio: "printexpress.graficas360.com",
    created_at: "2025-02-20",
    pedidos_mes: 128,
    gmv_mes: 18700,
  },
  {
    id: "3",
    nome_grafica: "Visual Art Comunicação",
    plano: "Ouro",
    status: "trial",
    dominio: "visualart.graficas360.com",
    created_at: "2026-03-01",
    pedidos_mes: 45,
    gmv_mes: 6300,
  },
  {
    id: "4",
    nome_grafica: "Mega Color Offset",
    plano: "Bronze",
    status: "inadimplente",
    dominio: "megacolor.graficas360.com",
    created_at: "2024-11-10",
    pedidos_mes: 0,
    gmv_mes: 0,
  },
  {
    id: "5",
    nome_grafica: "Rápida Digital",
    plano: "Bronze",
    status: "ativo",
    dominio: "rapidadigital.graficas360.com",
    created_at: "2025-06-05",
    pedidos_mes: 89,
    gmv_mes: 7400,
  },
  {
    id: "6",
    nome_grafica: "Top Banner Comunicação Visual",
    plano: "Prata",
    status: "suspenso",
    dominio: "topbanner.graficas360.com",
    created_at: "2025-04-12",
    pedidos_mes: 0,
    gmv_mes: 0,
  },
];

export const mockPlanos = [
  {
    id: "1",
    nome: "Bronze",
    valor: 197,
    has_digital: true,
    has_visual: false,
    has_offset: false,
    has_crm_advanced: false,
    tenants_count: 2,
  },
  {
    id: "2",
    nome: "Prata",
    valor: 397,
    has_digital: true,
    has_visual: true,
    has_offset: false,
    has_crm_advanced: false,
    tenants_count: 2,
  },
  {
    id: "3",
    nome: "Ouro",
    valor: 697,
    has_digital: true,
    has_visual: true,
    has_offset: true,
    has_crm_advanced: true,
    tenants_count: 2,
  },
];

export const mockMetricas = {
  gmv_total: 77600,
  total_pedidos: 604,
  total_tenants_ativos: 4,
  volume_m2: 12450,
  total_impressoes: 89200,
  churn_rate: 4.2,
  receita_recorrente: 2185,
};
