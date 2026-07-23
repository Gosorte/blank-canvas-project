import { useState } from "react";
import { Plus, Loader2, Trash2, Tag, Search } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenant } from "@/hooks/use-tenant";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MODULO_LABELS: Record<string, string> = {
  digital: "Digital",
  offset: "Offset",
  visual: "Comunicação Visual",
};

interface Props {
  tipoModulo: string;
}

function useProdutosSetor(tipoModulo: string) {
  const { activeTenantId } = useTenant();
  return useQuery({
    queryKey: ["produtos", activeTenantId, tipoModulo],
    enabled: !!activeTenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("tenant_id", activeTenantId!)
        .eq("tipo_modulo", tipoModulo)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function SetorProdutos({ tipoModulo }: Props) {
  const { activeTenantId } = useTenant();
  const { data: produtos, isLoading } = useProdutosSetor(tipoModulo);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const deleteProd = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produtos"] }),
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filtered = (produtos ?? []).filter((p: any) => p.nome.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title={`Produtos — ${MODULO_LABELS[tipoModulo]}`} subtitle="Catálogo de produtos configuráveis" />
      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <p className="text-sm text-muted-foreground">Para criar produtos, use o <strong>Motor de Preços</strong></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <div key={p.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{p.nome}</h3>
                    {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
                  </div>
                </div>
                <Badge variant={p.ativo ? "default" : "secondary"} className="text-[10px]">{p.ativo ? "Ativo" : "Inativo"}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-muted rounded-lg p-2 text-center">
                  <p className="font-bold text-foreground">R$ {Number(p.preco_minimo).toFixed(2)}</p>
                  <p className="text-muted-foreground">Preço Mín.</p>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <p className="font-bold text-foreground">{Number(p.markup)}%</p>
                  <p className="text-muted-foreground">Markup</p>
                </div>
              </div>

              {tipoModulo === "digital" && (
                <div className="text-xs text-muted-foreground">
                  Clique: R$ {Number(p.custo_clique).toFixed(2)} | Acabamento: R$ {Number(p.custo_acabamento).toFixed(2)}
                </div>
              )}
              {tipoModulo === "offset" && (
                <div className="text-xs text-muted-foreground">
                  Milheiro: R$ {Number(p.custo_milheiro).toFixed(2)} | Chapa: R$ {Number(p.custo_chapa).toFixed(2)}
                </div>
              )}
              {tipoModulo === "visual" && (
                <div className="text-xs text-muted-foreground">
                  m²: R$ {Number(p.custo_m2).toFixed(2)} | Substrato: {p.substrato || "—"}
                </div>
              )}

              <div className="flex justify-end mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(p.id)}>
                  <Trash2 size={12} className="mr-1" />Excluir
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum produto cadastrado para este módulo</div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Produto</AlertDialogTitle><AlertDialogDescription>Tem certeza?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteProd.mutateAsync(deleteId); toast.success("Excluído!"); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
