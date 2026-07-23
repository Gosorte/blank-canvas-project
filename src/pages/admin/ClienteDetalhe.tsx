import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCadastroById, useUpdateCadastro, ROLE_COLORS } from "@/hooks/use-cadastros";
import { CadastroFormDialog, type CadastroFormData } from "@/components/cadastros/CadastroFormDialog";
import { ClienteMiniDashboard } from "@/components/cadastros/ClienteMiniDashboard";
import { ClienteCreditWallet } from "@/components/cadastros/ClienteCreditWallet";
import { ClienteRecommendations } from "@/components/cadastros/ClienteRecommendations";
import { useTenant } from "@/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Building2, FileText, Users, UserCheck, Briefcase, ShieldCheck, Handshake, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROLE_ICONS: Record<string, any> = {
  cliente: Users,
  fornecedor: UserCheck,
  vendedor: Briefcase,
  funcionario: ShieldCheck,
  parceiro: Handshake,
  transportadora: Truck,
};

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const { data: cliente, isLoading } = useCadastroById(id);
  const updateMutation = useUpdateCadastro();
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = (data: CadastroFormData) => {
    if (!id) return;
    updateMutation.mutate({ id, ...data } as any, {
      onSuccess: () => { toast.success("Cadastro atualizado!"); setFormOpen(false); },
      onError: (e: any) => toast.error("Erro: " + e.message),
    });
  };

  if (isLoading) return (
    <div className="space-y-6 p-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  );

  if (!cliente) return (
    <div className="p-6 space-y-4">
      <Button variant="ghost" onClick={() => navigate("/admin/cadastros/clientes")}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>
      <p className="text-muted-foreground">Cadastro não encontrado.</p>
    </div>
  );

  const roles = cliente.roles ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/cadastros/clientes")}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{cliente.nome}</h1>
            {cliente.razao_social && <p className="text-sm text-muted-foreground">{cliente.razao_social}</p>}
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}><Pencil className="h-4 w-4 mr-2" /> Editar Cadastro</Button>
      </div>

      {/* Client info card */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contato</h3>
            <div className="space-y-2 text-sm">
              {cliente.telefone && (
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground shrink-0" />{cliente.telefone}</div>
              )}
              {cliente.whatsapp && (
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-500 shrink-0" />{cliente.whatsapp} (WhatsApp)</div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground shrink-0" />{cliente.email}</div>
              )}
              {cliente.contato_nome && (
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground shrink-0" />{cliente.contato_nome}</div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Endereço</h3>
            <div className="space-y-2 text-sm">
              {cliente.endereco ? (
                <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{cliente.endereco}{cliente.cidade && `, ${cliente.cidade}`}{cliente.estado && ` - ${cliente.estado}`}{cliente.cep && ` • ${cliente.cep}`}</span>
                </div>
              ) : <p className="text-muted-foreground text-xs">Não informado</p>}
              {cliente.cpf_cnpj && <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground shrink-0" />CPF/CNPJ: {cliente.cpf_cnpj}</div>}
              {cliente.origem && <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground shrink-0" />Origem: {cliente.origem}</div>}
            </div>
          </div>

          {/* Roles */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Atividades</h3>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const Icon = ROLE_ICONS[r] || Users;
                return (
                  <Badge key={r} variant="secondary" className={cn("text-xs flex items-center gap-1 px-2.5 py-1", ROLE_COLORS[r])}>
                    <Icon className="h-3 w-3" />
                    {r}
                  </Badge>
                );
              })}
            </div>
            {cliente.segmento && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" /> Segmento: <Badge variant="outline" className="text-xs capitalize">{cliente.segmento}</Badge>
              </div>
            )}
            {cliente.observacoes && <div className="mt-3"><p className="text-xs text-muted-foreground font-medium mb-1">Observações:</p><p className="text-sm">{cliente.observacoes}</p></div>}
          </div>
        </div>
      </Card>

      {/* Credit Wallet & Cashback */}
      <ClienteCreditWallet clienteId={cliente.id} clienteNome={cliente.nome} />

      {/* Recommendations */}
      <ClienteRecommendations clienteId={cliente.id} clienteNome={cliente.nome} segmento={cliente.segmento} />

      {/* Mini Dashboard */}
      <ClienteMiniDashboard clienteId={cliente.id} clienteNome={cliente.nome} />

      {/* Edit dialog */}
      <CadastroFormDialog open={formOpen} onOpenChange={setFormOpen} tenantId={activeTenantId ?? ""}
        initialData={{
          id: cliente.id, nome: cliente.nome, cpf_cnpj: cliente.cpf_cnpj ?? "", razao_social: cliente.razao_social ?? "",
          contato_nome: cliente.contato_nome ?? "", telefone: cliente.telefone ?? "", whatsapp: cliente.whatsapp ?? "",
          email: cliente.email ?? "", origem: cliente.origem ?? "", endereco: cliente.endereco ?? "", cidade: cliente.cidade ?? "",
          estado: cliente.estado ?? "", cep: cliente.cep ?? "", observacoes: cliente.observacoes ?? "",
          roles: cliente.roles ?? ["cliente"], segmento: cliente.segmento ?? "", tipo_pessoa: cliente.tipo_pessoa ?? "fisica",
        }}
        onSubmit={handleSubmit} isLoading={updateMutation.isPending} />
    </div>
  );
}