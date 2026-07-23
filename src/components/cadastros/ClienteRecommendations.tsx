import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ShoppingBag, Building2, Gift, Sparkles, Plus } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { subMonths } from "date-fns";

const DEFAULT_ASSOCIATIONS: Record<string, string[]> = {
  "cartão de visita": ["Papel Timbrado", "Envelopes", "Carimbos", "Pasta"],
  "cartões de visita": ["Papel Timbrado", "Envelopes", "Carimbos"],
  "identidade visual": ["Kit Papelaria (Cartão + Envelope)", "Banner", "Pasta"],
  "panfleto": ["Ímãs de Frigorífico", "Pastas de Proposta", "Adesivos"],
  "flyer": ["Ímãs de Frigorífico", "Pastas de Proposta", "Adesivos"],
  "banner": ["Cartazes A3", "Adesivos de Montra", "Porta-Banner (Roll-up)"],
  "lona": ["Cartazes A3", "Adesivos de Montra", "Porta-Banner (Roll-up)"],
  "adesivo": ["Rótulos em Bobina", "Tags", "Banner"],
  "adesivos de parede": ["Instalação Especializada", "Banner", "Placa"],
  "catálogo": ["Verniz Localizado", "Hot Stamping", "Folder", "Revista"],
  "folder": ["Cartão de Visita", "Catálogo", "Revista"],
  "pasta": ["Divisórias Internas Personalizadas", "Folder", "Catálogo"],
  "cardápio": ["Jogo Americano", "Cardápio Digital", "Banner"],
  "faixa": ["Banner", "Placa", "Cavalete"],
};

const SEGMENT_SUGGESTIONS: Record<string, string[]> = {
  restaurante: ["Ementas/Cardápios", "Jogo Americano", "Adesivos de Delivery", "Comanda", "Banner Promocional"],
  gastronomia: ["Ementas/Cardápios", "Jogo Americano", "Adesivos de Delivery", "Embalagem Personalizada"],
  eventos: ["Pulseiras de Identificação", "Crachás", "Ingressos de Segurança", "Backdrop", "Banner"],
  imobiliária: ["Placa de Venda", "Folder", "Banner", "Faixa"],
  loja: ["Banner", "Cartaz", "Adesivo de Vitrine", "Etiqueta", "Sacola Personalizada"],
  escritório: ["Cartão de Visita", "Papel Timbrado", "Envelope", "Pasta", "Carimbo"],
  saúde: ["Receituário", "Cartão de Visita", "Banner", "Folder"],
  educação: ["Apostila", "Banner", "Certificado", "Cartaz"],
  construção: ["Placa de Obra", "Adesivo de Segurança", "Banner", "Faixa"],
  beleza: ["Cartão de Visita", "Banner", "Folder", "Adesivo"],
  automotivo: ["Adesivo", "Banner", "Placa", "Faixa"],
};

const UPSELL_MATRIX: Record<string, { suggestion: string; reason: string }[]> = {
  "identidade visual": [{ suggestion: "Kit Papelaria (Cartão + Envelope)", reason: "Profissionalismo imediato" }],
  "adesivos de parede": [{ suggestion: "Instalação Especializada", reason: "Aumenta o ticket médio do serviço" }],
  "catálogo": [{ suggestion: "Verniz Localizado / Hot Stamping", reason: "Upgrade para acabamento Premium" }],
  "banner": [{ suggestion: "Porta-Banner (Roll-up)", reason: "Estrutura completa de exposição" }],
  "pasta": [{ suggestion: "Divisórias Internas Personalizadas", reason: "Organização extra para o cliente" }],
};

export function ClienteRecommendations({ clienteId, clienteNome, segmento }: { clienteId: string; clienteNome: string; segmento?: string | null }) {
  const { activeTenantId } = useTenant();
  const sixMonthsAgo = subMonths(new Date(), 6).toISOString();

  // Get client's order items from erp_orcamento_itens via erp_pedidos
  const { data: orderItems = [] } = useQuery({
    queryKey: ["cliente-order-items-rec", clienteId, activeTenantId],
    queryFn: async () => {
      const { data: pedidos } = await supabase.from("erp_pedidos")
        .select("id, created_at").eq("tenant_id", activeTenantId!)
        .or(`cliente_id.eq.${clienteId}${clienteNome ? `,cliente_nome.eq.${clienteNome}` : ""}`);
      if (!pedidos?.length) return [];
      const ids = pedidos.map((p) => p.id);
      // erp_orcamento_itens are linked via orcamento_id which can be pedido or orcamento
      const { data, error } = await supabase.from("erp_orcamento_itens")
        .select("descricao, created_at").in("orcamento_id", ids);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    enabled: !!activeTenantId,
  });

  // Get cashback balance
  const { data: creditAccount } = useQuery({
    queryKey: ["customer-credit-rec", clienteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("customer_credits")
        .select("cashback_balance").eq("cliente_id", clienteId).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const cashbackBalance = Number(creditAccount?.cashback_balance ?? 0);

  const allProducts = orderItems.map((i: any) => (i.descricao || "").toLowerCase().trim());
  const recentProducts = orderItems
    .filter((i: any) => i.created_at >= sixMonthsAgo)
    .map((i: any) => (i.descricao || "").toLowerCase().trim());

  const suggestions = new Set<string>();
  const upsells: { suggestion: string; reason: string }[] = [];

  // History-based suggestions (local rules only, no DB table needed)
  allProducts.forEach((product: string) => {
    Object.entries(DEFAULT_ASSOCIATIONS).forEach(([key, values]) => {
      if (product.includes(key)) values.forEach((v) => suggestions.add(v));
    });
    Object.entries(UPSELL_MATRIX).forEach(([key, items]) => {
      if (product.includes(key)) items.forEach((u) => {
        if (!upsells.find((x) => x.suggestion === u.suggestion)) upsells.push(u);
      });
    });
  });

  // Segment-based
  if (segmento) {
    const segKey = segmento.toLowerCase().trim();
    Object.entries(SEGMENT_SUGGESTIONS).forEach(([key, values]) => {
      if (segKey.includes(key)) values.forEach((v) => suggestions.add(v));
    });
  }

  // Filter: only suggest what NOT bought in last 6 months
  const finalSuggestions = Array.from(suggestions).filter(
    (s) => !recentProducts.some((p: string) => p.includes(s.toLowerCase()))
  );

  const finalUpsells = upsells.filter(
    (u) => !recentProducts.some((p: string) => p.includes(u.suggestion.toLowerCase()))
  );

  if (finalSuggestions.length === 0 && finalUpsells.length === 0 && !segmento) return null;

  return (
    <div className="space-y-4">
      <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <h4 className="text-sm font-bold mb-1 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Oportunidades para Você
        </h4>
        <p className="text-xs text-muted-foreground mb-4">Sugestões baseadas no histórico de compras e segmento do cliente.</p>

        {cashbackBalance > 0 && (
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-md bg-green-500/10 border border-green-500/20">
            <Gift className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-xs font-medium text-green-700">
              Cashback disponível:{" "}
              <strong>
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cashbackBalance)}
              </strong>{" "}
              — desconto imediato no próximo pedido!
            </span>
          </div>
        )}

        {segmento && (
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" /> Segmento: <Badge variant="outline" className="text-[10px]">{segmento}</Badge>
          </div>
        )}

        {finalSuggestions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3 text-amber-500" /> Cross-Sell
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {finalSuggestions.slice(0, 8).map((s) => (
                <div key={s} className="flex items-center gap-2 rounded-md border bg-card p-2.5 text-xs hover:border-primary/40 transition-colors">
                  <ShoppingBag className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium truncate">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {finalUpsells.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Up-Sell</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {finalUpsells.slice(0, 4).map((u) => (
                <div key={u.suggestion} className="flex items-start gap-2 rounded-md border bg-card p-3 text-xs hover:border-primary/40 transition-colors">
                  <Plus className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div><p className="font-semibold">{u.suggestion}</p><p className="text-muted-foreground">{u.reason}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {finalSuggestions.length === 0 && finalUpsells.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhuma sugestão disponível. Registre mais pedidos para gerar recomendações.</p>
        )}
      </Card>
    </div>
  );
}
