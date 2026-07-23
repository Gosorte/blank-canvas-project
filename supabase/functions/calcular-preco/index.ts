import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CalculoRequest {
  tenant_id: string;
  produto_id: string;
  // Digital
  quantidade_folhas?: number;
  // Offset
  quantidade_milheiros?: number;
  num_chapas?: number;
  // Visual
  largura_m?: number;
  altura_m?: number;
  // Comum
  acabamentos?: string[];
}

interface CalculoResult {
  tipo_modulo: string;
  produto_nome: string;
  custo_insumos: number;
  custo_producao: number;
  markup_percentual: number;
  preco_venda: number;
  preco_minimo: number;
  preco_final: number;
  detalhamento: Record<string, number>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: CalculoRequest = await req.json();
    const { tenant_id, produto_id } = body;

    if (!tenant_id || !produto_id) {
      return new Response(
        JSON.stringify({ error: "tenant_id e produto_id são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar produto
    const { data: produto, error: prodErr } = await supabase
      .from("produtos")
      .select("*")
      .eq("id", produto_id)
      .eq("tenant_id", tenant_id)
      .single();

    if (prodErr || !produto) {
      return new Response(
        JSON.stringify({ error: "Produto não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar insumos do tenant para o módulo
    const { data: insumos } = await supabase
      .from("insumos_precos")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("tipo_modulo", produto.tipo_modulo);

    const insumosMap = new Map(
      (insumos ?? []).map((i: any) => [i.nome_insumo, i])
    );

    let resultado: CalculoResult;

    switch (produto.tipo_modulo) {
      case "digital":
        resultado = calcularDigital(produto, body, insumosMap);
        break;
      case "offset":
        resultado = calcularOffset(produto, body, insumosMap);
        break;
      case "visual":
        resultado = calcularVisual(produto, body, insumosMap);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Módulo "${produto.tipo_modulo}" não suportado` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(resultado), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── DIGITAL: custo por clique/folha + acabamentos ─────────────────
function calcularDigital(
  produto: any,
  params: CalculoRequest,
  insumos: Map<string, any>
): CalculoResult {
  const qtd = params.quantidade_folhas ?? 1;
  const custoClique = Number(produto.custo_clique) * qtd;
  const custoAcabamento = Number(produto.custo_acabamento) * qtd;
  const custoProducao = custoClique + custoAcabamento;

  // Somar custo de insumos relacionados
  let custoInsumos = 0;
  insumos.forEach((insumo) => {
    custoInsumos += Number(insumo.custo_base) * qtd;
  });

  const custoTotal = custoProducao + custoInsumos;
  const markupFator = 1 + Number(produto.markup) / 100;
  const precoVenda = custoTotal * markupFator;
  const precoFinal = Math.max(precoVenda, Number(produto.preco_minimo));

  return {
    tipo_modulo: "digital",
    produto_nome: produto.nome,
    custo_insumos: round(custoInsumos),
    custo_producao: round(custoProducao),
    markup_percentual: Number(produto.markup),
    preco_venda: round(precoVenda),
    preco_minimo: Number(produto.preco_minimo),
    preco_final: round(precoFinal),
    detalhamento: {
      quantidade_folhas: qtd,
      custo_clique_unitario: Number(produto.custo_clique),
      custo_acabamento_unitario: Number(produto.custo_acabamento),
      custo_clique_total: round(custoClique),
      custo_acabamento_total: round(custoAcabamento),
    },
  };
}

// ─── OFFSET: milheiro + chapas + setup ──────────────────────────────
function calcularOffset(
  produto: any,
  params: CalculoRequest,
  insumos: Map<string, any>
): CalculoResult {
  const milheiros = params.quantidade_milheiros ?? 1;
  const chapas = params.num_chapas ?? 1;

  const custoMilheiro = Number(produto.custo_milheiro) * milheiros;
  const custoChapas = Number(produto.custo_chapa) * chapas;
  const custoSetup = Number(produto.custo_setup);
  const custoProducao = custoMilheiro + custoChapas + custoSetup;

  let custoInsumos = 0;
  insumos.forEach((insumo) => {
    custoInsumos += Number(insumo.custo_base) * milheiros;
  });

  const custoTotal = custoProducao + custoInsumos;
  const markupFator = 1 + Number(produto.markup) / 100;
  const precoVenda = custoTotal * markupFator;
  const precoFinal = Math.max(precoVenda, Number(produto.preco_minimo));

  return {
    tipo_modulo: "offset",
    produto_nome: produto.nome,
    custo_insumos: round(custoInsumos),
    custo_producao: round(custoProducao),
    markup_percentual: Number(produto.markup),
    preco_venda: round(precoVenda),
    preco_minimo: Number(produto.preco_minimo),
    preco_final: round(precoFinal),
    detalhamento: {
      quantidade_milheiros: milheiros,
      num_chapas: chapas,
      custo_milheiro_total: round(custoMilheiro),
      custo_chapas_total: round(custoChapas),
      custo_setup: round(custoSetup),
    },
  };
}

// ─── VISUAL: m² + substrato + estrutura ─────────────────────────────
function calcularVisual(
  produto: any,
  params: CalculoRequest,
  insumos: Map<string, any>
): CalculoResult {
  const largura = params.largura_m ?? 1;
  const altura = params.altura_m ?? 1;
  const area = largura * altura;

  const custoM2 = Number(produto.custo_m2) * area;
  const custoEstrutura = Number(produto.custo_estrutura);
  const custoProducao = custoM2 + custoEstrutura;

  let custoInsumos = 0;
  insumos.forEach((insumo) => {
    custoInsumos += Number(insumo.custo_base) * area;
  });

  const custoTotal = custoProducao + custoInsumos;
  const markupFator = 1 + Number(produto.markup) / 100;
  const precoVenda = custoTotal * markupFator;
  const precoFinal = Math.max(precoVenda, Number(produto.preco_minimo));

  return {
    tipo_modulo: "visual",
    produto_nome: produto.nome,
    custo_insumos: round(custoInsumos),
    custo_producao: round(custoProducao),
    markup_percentual: Number(produto.markup),
    preco_venda: round(precoVenda),
    preco_minimo: Number(produto.preco_minimo),
    preco_final: round(precoFinal),
    detalhamento: {
      largura_m: largura,
      altura_m: altura,
      area_m2: round(area),
      substrato: produto.substrato,
      custo_m2_total: round(custoM2),
      custo_estrutura: round(custoEstrutura),
    },
  };
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}
