import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useCadastros, useCreateCadastro, useUpdateCadastro, useDeleteCadastro, ROLE_OPTIONS, ROLE_COLORS, type CadastroUnificado } from "@/hooks/use-cadastros";
import { useTenant } from "@/hooks/use-tenant";
import { CadastroFormDialog, type CadastroFormData } from "@/components/cadastros/CadastroFormDialog";
import { DuplicateFoundDialog } from "@/components/cadastros/DuplicateFoundDialog";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Users, UserCheck, Briefcase, ShieldCheck, Handshake, Truck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROLE_FILTERS = [
  { value: "todos", label: "Todos", icon: Users },
  { value: "cliente", label: "Clientes", icon: Users },
  { value: "fornecedor", label: "Fornecedores", icon: UserCheck },
  { value: "vendedor", label: "Vendedores", icon: Briefcase },
  { value: "funcionario", label: "Funcionários", icon: ShieldCheck },
  { value: "parceiro", label: "Parceiros", icon: Handshake },
  { value: "transportadora", label: "Transportadoras", icon: Truck },
];

export default function Clientes() {
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();
  const { data: cadastros = [], isLoading } = useCadastros();
  const createMutation = useCreateCadastro();
  const updateMutation = useUpdateCadastro();
  const deleteMutation = useDeleteCadastro();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<(Partial<CadastroFormData> & { id?: string }) | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [duplicateRecord, setDuplicateRecord] = useState<CadastroUnificado | null>(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = cadastros;
    if (roleFilter !== "todos") list = list.filter((c) => c.roles?.includes(roleFilter));
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) => c.nome.toLowerCase().includes(s) || c.telefone?.includes(s) || c.email?.toLowerCase().includes(s) || c.cpf_cnpj?.includes(s));
    }
    return list;
  }, [cadastros, roleFilter, search]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { todos: cadastros.length };
    cadastros.forEach((c) => c.roles?.forEach((r) => { counts[r] = (counts[r] || 0) + 1; }));
    return counts;
  }, [cadastros]);

  const handleNew = () => { setEditData(undefined); setFormOpen(true); };
  const handleEdit = (c: CadastroUnificado) => {
    setEditData({
      id: c.id, nome: c.nome, cpf_cnpj: c.cpf_cnpj ?? "", razao_social: c.razao_social ?? "",
      contato_nome: c.contato_nome ?? "", telefone: c.telefone ?? "", whatsapp: c.whatsapp ?? "",
      email: c.email ?? "", origem: c.origem ?? "", endereco: c.endereco ?? "", cidade: c.cidade ?? "",
      estado: c.estado ?? "", cep: c.cep ?? "", observacoes: c.observacoes ?? "",
      roles: c.roles ?? ["cliente"], segmento: c.segmento ?? "", tipo_pessoa: c.tipo_pessoa ?? "fisica",
    });
    setFormOpen(true);
  };

  const handleSubmit = (data: CadastroFormData) => {
    if (editData?.id) {
      updateMutation.mutate({ id: editData.id, ...data } as any, {
        onSuccess: () => { toast.success("Cadastro atualizado!"); setFormOpen(false); },
        onError: (e: any) => toast.error("Erro: " + e.message),
      });
    } else {
      createMutation.mutate({ ...data, tenant_id: activeTenantId!, ativo: true } as any, {
        onSuccess: () => { toast.success("Cadastro criado!"); setFormOpen(false); },
        onError: (e: any) => toast.error("Erro: " + e.message),
      });
    }
  };

  const handleDuplicateFound = (record: CadastroUnificado) => { setDuplicateRecord(record); setDuplicateOpen(true); };
  const handleEditDuplicate = (record: CadastroUnificado) => { setFormOpen(false); setTimeout(() => handleEdit(record), 200); };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div>
      <AdminHeader title="Cadastros Gerais" subtitle="Gerencie clientes, fornecedores, vendedores e mais em um único lugar." />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div />
          <Button onClick={handleNew}><Plus className="h-4 w-4 mr-2" />Novo Cadastro</Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {ROLE_FILTERS.map((rf) => {
            const Icon = rf.icon;
            const active = roleFilter === rf.value;
            return (
              <button key={rf.value} onClick={() => setRoleFilter(rf.value)}
                className={cn("flex items-center gap-2 rounded-sm border px-4 py-2 text-sm font-medium transition-all",
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted/50")}>
                <Icon className="h-4 w-4" />{rf.label}
                <span className="ml-1 text-xs opacity-70">({roleCounts[rf.value] || 0})</span>
              </button>
            );
          })}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, telefone, email ou documento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="rounded-sm border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Atividades</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum cadastro encontrado</TableCell></TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/cadastros/clientes/${c.id}`)}>
                  <TableCell className="font-medium">
                    {c.nome}
                    {c.razao_social && <span className="block text-xs text-muted-foreground">{c.razao_social}</span>}
                  </TableCell>
                  <TableCell>{c.telefone || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell>{c.origem || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(c.roles ?? []).map((r) => (
                        <Badge key={r} variant="secondary" className={cn("text-xs", ROLE_COLORS[r])}>{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CadastroFormDialog open={formOpen} onOpenChange={setFormOpen} initialData={editData} onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending} tenantId={activeTenantId ?? ""}
        onDuplicateFound={handleDuplicateFound} />

      <DuplicateFoundDialog open={duplicateOpen} onOpenChange={setDuplicateOpen} duplicate={duplicateRecord}
        onEdit={handleEditDuplicate} onProceed={(r) => toast.info("Dados preenchidos. Ajuste e salve.")} />

      <DeleteConfirmDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId, { onSuccess: () => { toast.success("Excluído!"); setDeleteId(null); } })}
        isLoading={deleteMutation.isPending} itemName="este cadastro" />
    </div>
  );
}
