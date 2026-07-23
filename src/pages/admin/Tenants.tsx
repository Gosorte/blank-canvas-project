import { useState } from "react";
import { Building2, Plus, Search, MoreHorizontal, Globe, Calendar, Loader2, Pencil, Trash2 } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant, Tenant } from "@/hooks/use-tenants";
import { usePlanos } from "@/hooks/use-planos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig = {
  ativo: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  trial: { label: "Trial", className: "bg-info/10 text-info border-info/20" },
  inadimplente: { label: "Inadimplente", className: "bg-destructive/10 text-destructive border-destructive/20" },
  suspenso: { label: "Suspenso", className: "bg-warning/10 text-warning border-warning/20" },
};

export default function Tenants() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [nome, setNome] = useState("");
  const [planoId, setPlanoId] = useState("");
  const [slug, setSlug] = useState("");
  const [editNome, setEditNome] = useState("");
  const [editPlanoId, setEditPlanoId] = useState("");
  const [editDominio, setEditDominio] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const { data: tenants, isLoading } = useTenants();
  const { data: planos } = usePlanos();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

  const filtered = (tenants ?? []).filter((t) => {
    const matchSearch = t.nome_grafica.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateTenant = async () => {
    if (!nome || !planoId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      await createTenant.mutateAsync({
        nome_grafica: nome,
        plano_id: planoId,
        dominio: slug ? `${slug}.graficas360.com` : "",
      });
      toast.success("Tenant criado com sucesso!");
      setDialogOpen(false);
      setNome("");
      setPlanoId("");
      setSlug("");
    } catch {
      toast.error("Erro ao criar tenant");
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditNome(tenant.nome_grafica);
    setEditPlanoId(tenant.plano_id ?? "");
    setEditDominio(tenant.dominio ?? "");
    setEditStatus(tenant.status);
    setEditDialogOpen(true);
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant || !editNome) {
      toast.error("Preencha o nome da gráfica");
      return;
    }
    try {
      await updateTenant.mutateAsync({
        id: selectedTenant.id,
        nome_grafica: editNome,
        plano_id: editPlanoId || undefined,
        dominio: editDominio,
        status: editStatus,
      });
      toast.success("Tenant atualizado com sucesso!");
      setEditDialogOpen(false);
      setSelectedTenant(null);
    } catch {
      toast.error("Erro ao atualizar tenant");
    }
  };

  const openDeleteDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    try {
      await deleteTenant.mutateAsync(selectedTenant.id);
      toast.success("Tenant excluído com sucesso!");
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
    } catch {
      toast.error("Erro ao excluir tenant");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Tenants" subtitle="Gerencie as gráficas assinantes" />

      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input placeholder="Buscar gráfica..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="inadimplente">Inadimplente</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus size={16} />Novo Tenant</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Criar Nova Gráfica</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Nome da Gráfica</Label>
                  <Input placeholder="Ex: Gráfica Modelo" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={planoId} onValueChange={setPlanoId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                    <SelectContent>
                      {(planos ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome} - R$ {p.valor}/mês</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slug da Loja</Label>
                  <div className="flex items-center gap-2">
                    <Input placeholder="minha-grafica" value={slug} onChange={(e) => setSlug(e.target.value)} />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">.graficas360.com</span>
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreateTenant} disabled={createTenant.isPending}>
                  {createTenant.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Criar Instância
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((tenant) => {
            const status = statusConfig[tenant.status as keyof typeof statusConfig];
            return (
              <div key={tenant.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all duration-300 animate-fade-in group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{tenant.nome_grafica}</h3>
                      <Badge variant="secondary" className="text-[10px] mt-1">{tenant.planos?.nome ?? "—"}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={cn("text-[10px]", status?.className)}>{status?.label ?? tenant.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(tenant)}>
                          <Pencil size={14} className="mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(tenant)} className="text-destructive focus:text-destructive">
                          <Trash2 size={14} className="mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Globe size={13} /><span className="font-mono">{tenant.dominio}</span></div>
                  <div className="flex items-center gap-2"><Calendar size={13} /><span>Desde {new Date(tenant.created_at).toLocaleDateString("pt-BR")}</span></div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="text-xs"><span className="text-muted-foreground">Pedidos: </span><span className="font-semibold text-foreground">{tenant.pedidos_mes}</span></div>
                  <div className="text-xs"><span className="text-muted-foreground">GMV: </span><span className="font-semibold text-foreground">R$ {Number(tenant.gmv_mes).toLocaleString("pt-BR")}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Gráfica</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nome da Gráfica</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={editPlanoId} onValueChange={setEditPlanoId}>
                <SelectTrigger><SelectValue placeholder="Selecione o plano" /></SelectTrigger>
                <SelectContent>
                  {(planos ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome} - R$ {p.valor}/mês</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Domínio</Label>
              <Input value={editDominio} onChange={(e) => setEditDominio(e.target.value)} placeholder="loja.minhagrafica.com.br" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inadimplente">Inadimplente</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleUpdateTenant} disabled={updateTenant.isPending}>
              {updateTenant.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Gráfica</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{selectedTenant?.nome_grafica}</strong>? Esta ação não pode ser desfeita e todos os dados associados serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTenant.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
