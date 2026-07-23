import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CadastroUnificado } from "@/hooks/use-cadastros";
import { ROLE_COLORS } from "@/hooks/use-cadastros";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicate: CadastroUnificado | null;
  onEdit: (record: CadastroUnificado) => void;
  onProceed?: (record: CadastroUnificado) => void;
}

export function DuplicateFoundDialog({ open, onOpenChange, duplicate, onEdit, onProceed }: Props) {
  if (!duplicate) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Cadastro já existente</DialogTitle>
          <DialogDescription>
            Foi encontrado um cadastro com o mesmo <strong>CPF/CNPJ, Telefone ou WhatsApp</strong>. Deseja editar o cadastro existente?
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="font-semibold text-sm">{duplicate.nome}</p>
          {duplicate.razao_social && <p className="text-xs text-muted-foreground">{duplicate.razao_social}</p>}
          <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
            {duplicate.cpf_cnpj && <span>CPF/CNPJ: {duplicate.cpf_cnpj}</span>}
            {duplicate.telefone && <span>Tel: {duplicate.telefone}</span>}
            {duplicate.whatsapp && <span>WhatsApp: {duplicate.whatsapp}</span>}
            {duplicate.email && <span>Email: {duplicate.email}</span>}
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {(duplicate.roles ?? []).map((r) => (
              <Badge key={r} variant="secondary" className={cn("text-xs", ROLE_COLORS[r])}>{r}</Badge>
            ))}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          {onProceed && (
            <Button variant="secondary" onClick={() => { onProceed(duplicate); onOpenChange(false); }}>Prosseguir</Button>
          )}
          <Button onClick={() => { onEdit(duplicate); onOpenChange(false); }}>Editar Cadastro</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
