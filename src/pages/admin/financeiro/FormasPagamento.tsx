import { useState } from "react";
import { useTenant } from "@/hooks/use-tenant";
import {
  useAllFormasPagamento,
  useCreateFormaPagamento,
  useUpdateFormaPagamento,
  useDeleteFormaPagamento,
} from "@/hooks/use-formas-pagamento";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, Pencil, Trash2, CreditCard, Banknote, QrCode, FileText, Wallet, DollarSign, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const ICON_OPTIONS = [
  { value: "banknote", label: "Dinheiro", icon: Banknote },
  { value: "qrcode", label: "QR Code / PIX", icon: QrCode },
  { value: "creditcard", label: "Cartão", icon: CreditCard },
  { value: "filetext", label: "Boleto/Cheque", icon: FileText },
  { value: "wallet", label: "Carteira", icon: Wallet },
  { value: "dollar", label: "Transferência", icon: DollarSign },
];

const TIPO_OPTIONS = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "credito", label: "Cartão de Crédito" },
  { value: "debito", label: "Cartão de Débito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
  { value: "cheque", label: "Cheque" },
  { value: "crediario", label: "Crediário" },
  { value: "outros", label: "Outros" },
];

function getIconComponent(icone: string) {
  const found = ICON_OPTIONS.find((o) => o.value === icone);
  return found?.icon || Banknote;
}

export default function FormasPagamento() {
  const { activeTenantId } = useTenant();
  const { data, isLoading } = useAllFormasPagamento(activeTenantId || undefined);
  const createMutation = useCreateFormaPagamento();
  const updateMutation = useUpdateFormaPagamento();
  const deleteMutation = useDeleteFormaPagamento();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const [form, setForm] = useState({
    nome: "",
    tipo: "outros",
    icone: "banknote",
    ativo: true,
    ordem: 0,
  });

  const openNew = () => {
    setEditItem(null);
    setForm({ nome: "", tipo: "outros", icone: "banknote", ativo: true, ordem: (data?.length ?? 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      nome: item.nome,
      tipo: item.tipo,
      icone: item.icone || "banknote",
      ativo: item.ativo,
      ordem: item.ordem,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da forma de pagamento");
      return;
    }
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...form });
        toast.success("Forma de pagamento atualizada!");
      } else {
        await createMutation.mutateAsync({ ...form, tenant_id: activeTenantId! });
        toast.success("Forma de pagamento cadastrada!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteMutation.mutateAsync(deleteItem.id);
      toast.success("Removido!");
      setDeleteDialogOpen(false);
      setDeleteItem(null);
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const handleToggleAtivo = async (item: any) => {
    await updateMutation.mutateAsync({ id: item.id, ativo: !item.ativo });
    toast.success(item.ativo ? "Desativada" : "Ativada");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-primary" />
            Formas de Pagamento
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure as formas de pagamento disponíveis para sua empresa
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Forma
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ícone</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!data || data.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma forma de pagamento cadastrada</p>
                    <p className="text-xs mt-1">Clique em "Nova Forma" para começar</p>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const IconComp = getIconComponent(item.icone);
                  const tipoLabel = TIPO_OPTIONS.find((t) => t.value === item.tipo)?.label || item.tipo;
                  return (
                    <TableRow key={item.id} className={!item.ativo ? "opacity-50" : ""}>
                      <TableCell>
                        <IconComp className="h-5 w-5 text-primary" />
                      </TableCell>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{tipoLabel}</Badge>
                      </TableCell>
                      <TableCell>{item.ordem}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.ativo}
                          onCheckedChange={() => handleToggleAtivo(item)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteItem(item);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de cadastro/edição */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Cartão de Crédito"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ícone</Label>
                <Select value={form.icone} onValueChange={(v) => setForm({ ...form, icone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((o) => {
                      const I = o.icon;
                      return (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="flex items-center gap-2">
                            <I className="h-4 w-4" /> {o.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.ordem}
                  onChange={(e) => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ativo</Label>
                <div className="pt-2">
                  <Switch
                    checked={form.ativo}
                    onCheckedChange={(v) => setForm({ ...form, ativo: v })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editItem ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={deleteItem?.nome}
      />
    </div>
  );
}
