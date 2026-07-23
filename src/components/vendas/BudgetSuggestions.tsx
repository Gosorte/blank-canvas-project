import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/use-tenant";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShoppingBag, Gift } from "lucide-react";

interface Props {
  clientName: string;
}

const CROSS_SELL: Record<string, string[]> = {
  "cartão de visita": ["Papel Timbrado", "Envelopes", "Carimbos"],
  "cartões de visita": ["Papel Timbrado", "Envelopes", "Carimbos"],
  "panfleto": ["Ímãs de Geladeira", "Pastas de Proposta"],
  "flyer": ["Ímãs de Geladeira", "Pastas de Proposta"],
  "banner": ["Cartazes A3", "Adesivos de Vitrine", "Porta-Banner (Roll-up)"],
  "lona": ["Cartazes A3", "Adesivos de Vitrine"],
  "adesivo": ["Rótulos em Bobina", "Tags"],
  "catálogo": ["Verniz Localizado", "Hot Stamping"],
  "pasta": ["Divisórias Internas Personalizadas"],
};

export function BudgetSuggestions({ clientName }: Props) {
  const { activeTenantId } = useTenant();

  const { data: cashback } = useQuery({
    queryKey: ["budget-cashback", clientName, activeTenantId],
    queryFn: async () => {
      if (!clientName.trim() || !activeTenantId) return 0;
      const { data: client } = await supabase.from("clientes")
        .select("id").eq("tenant_id", activeTenantId).ilike("nome", clientName.trim()).maybeSingle();
      if (!client) return 0;
      const { data: credit } = await supabase.from("customer_credits")
        .select("saldo_cashback").eq("cliente_id", client.id).eq("tenant_id", activeTenantId).maybeSingle();
      return Number(credit?.saldo_cashback ?? 0);
    },
    enabled: !!clientName.trim() && !!activeTenantId,
  });

  const { data: recentItems = [] } = useQuery({
    queryKey: ["budget-recent-items", clientName, activeTenantId],
    queryFn: async () => {
      if (!clientName.trim() || !activeTenantId) return [];
      const { data: orders } = await supabase.from("erp_pedidos")
        .select("id").eq("tenant_id", activeTenantId).ilike("cliente_nome", clientName.trim()).limit(10);
      if (!orders?.length) return [];
      const { data } = await supabase.from("erp_orcamento_itens")
        .select("descricao").in("orcamento_id", orders.map((o) => o.id));
      return (data ?? []).map((i: any) => (i.descricao || "").toLowerCase().trim());
    },
    enabled: !!clientName.trim() && !!activeTenantId,
  });

  const suggestions = new Set<string>();
  recentItems.forEach((product: string) => {
    Object.entries(CROSS_SELL).forEach(([key, values]) => {
      if (product.includes(key)) values.forEach((v) => suggestions.add(v));
    });
  });

  const finalSuggestions = Array.from(suggestions).filter(
    (s) => !recentItems.some((p: string) => p.includes(s.toLowerCase()))
  );

  const cashbackValue = cashback ?? 0;
  if (finalSuggestions.length === 0 && cashbackValue <= 0) return null;

  return (
    <Card className="p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wide">Sugestões para este cliente</span>
      </div>
      {cashbackValue > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-md bg-green-500/10 border border-green-500/20">
          <Gift className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="text-xs text-green-700">
            <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cashbackValue)}</strong> de cashback disponível!
          </span>
        </div>
      )}
      {finalSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {finalSuggestions.slice(0, 6).map((s) => (
            <div key={s} className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs">
              <ShoppingBag className="h-3 w-3 text-primary shrink-0" />
              <span className="font-medium">{s}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
