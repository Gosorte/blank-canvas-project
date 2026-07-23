import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGrupos, useCreateGrupo, useUpdateGrupo, useDeleteGrupo,
  PERMISSOES_DISPONIVEIS, type Grupo,
} from "@/hooks/use-cargos";
import { Users, Plus, Pencil, Trash2, Loader2, Save, Shield } from "lucide-react";
import { toast } from "sonner";

interface Props {
  tenantId: string;
}

export function CargosManager({ tenantId }: Props) {
  const { data: grupos, isLoading } = useGrupos();
  const createGrupo = useCreateGrupo();
  const updateGrupo = useUpdateGrupo();
  const deleteGrupo = useDeleteGrupo();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Grupo | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [permissoes, setPermissoes] = useState<string[]>([]);

  const openCreate = () => {
    setEditingGrupo(null);
    setNome("");
    setDescricao("");
    setPermissoes([]);
    setDialogOpen(true);
  };

  const openEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setNome(grupo.nome);
    setDescricao(grupo.descricao || "");
    setPermissoes(grupo.permissoes || []);
    setDialogOpen(true);
  };

  const togglePermissao = (key: string) => {
    setPermissoes(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    setPermissoes(PERMISSOES_DISPONIVEIS.map(p => p.key));
  };

  const clearAll = () => {
    setPermissoes([]);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do grupo");
      return;
    }
    try {
      if (editingGrupo) {
        await updateGrupo.mutateAsync({ id: editingGrupo.id, nome, descricao, permissoes });
        toast.success("Grupo atualizado!");
      } else {
        await createGrupo.mutateAsync({ tenant_id: tenantId, nome, descricao, permissoes });
        toast.success("Grupo criado!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar grupo");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGrupo.mutateAsync(deleteTarget.id);
      toast.success("Grupo excluído!");
      setDeleteTarget(null);
    } catch {
      toast.error("Erro ao excluir grupo");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const erpPerms = PERMISSOES_DISPONIVEIS.filter(p => p.modulo === "erp");
  const otherPerms = PERMISSOES_DISPONIVEIS.filter(p => p.modulo !== "erp");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Grupos & Permissões</h3>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Novo Grupo
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Crie grupos com permissões específicas e atribua aos operadores. Admins sempre têm acesso total.
      </p>

      {(grupos || []).length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center space-y-3">
          <Users className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Nenhum grupo criado</p>
          <Button size="sm" variant="outline" onClick={openCreate}>Criar primeiro grupo</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(grupos || []).map(grupo => (
            <div key={grupo.id} className="bg-card rounded-xl border p-4 space-y-3 group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    {grupo.nome}
                  </h4>
                  {grupo.descricao && (
                    <p className="text-xs text-muted-foreground mt-1">{grupo.descricao}</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(grupo)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(grupo)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {grupo.permissoes.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">Sem permissões</span>
                ) : (
                  grupo.permissoes.map(p => {
                    const perm = PERMISSOES_DISPONIVEIS.find(d => d.key === p);
                    return (
                      <Badge key={p} variant="secondary" className="text-[10px]">
                        {perm?.label || p}
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGrupo ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label>Nome do Grupo *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Vendas, Produção, Financeiro" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição das responsabilidades do grupo..." rows={2} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Permissões de Acesso</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="ghost" className="text-xs h-6" onClick={selectAll}>Marcar todos</Button>
                  <Button type="button" size="sm" variant="ghost" className="text-xs h-6" onClick={clearAll}>Limpar</Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">ERP</p>
                  <div className="grid grid-cols-2 gap-2">
                    {erpPerms.map(p => (
                      <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                        <Checkbox
                          checked={permissoes.includes(p.key)}
                          onCheckedChange={() => togglePermissao(p.key)}
                        />
                        <span className="text-xs">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Outros Módulos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {otherPerms.map(p => (
                      <label key={p.key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                        <Checkbox
                          checked={permissoes.includes(p.key)}
                          onCheckedChange={() => togglePermissao(p.key)}
                        />
                        <span className="text-xs">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={createGrupo.isPending || updateGrupo.isPending}>
              {(createGrupo.isPending || updateGrupo.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingGrupo ? "Salvar Alterações" : "Criar Grupo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo <strong>{deleteTarget?.nome}</strong>? 
              Usuários deste grupo perderão suas permissões.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
