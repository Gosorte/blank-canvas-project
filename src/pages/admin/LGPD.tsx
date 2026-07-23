import { Shield, FileText, Eye, Trash2, Download } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const logsAuditoria = [
  { id: "1", usuario: "admin@graficasilva.com", acao: "exportacao", tabela: "clientes", data: "2026-03-19 14:32" },
  { id: "2", usuario: "sistema", acao: "anonimizacao", tabela: "clientes", data: "2026-03-18 02:00" },
  { id: "3", usuario: "admin@printexpress.com", acao: "acesso", tabela: "pedidos", data: "2026-03-18 11:15" },
  { id: "4", usuario: "admin@graficasilva.com", acao: "exclusao", tabela: "clientes", data: "2026-03-17 09:45" },
];

const acaoConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  acesso: { label: "Acesso", icon: Eye, className: "bg-info/10 text-info border-info/20" },
  exportacao: { label: "Exportação", icon: Download, className: "bg-warning/10 text-warning border-warning/20" },
  exclusao: { label: "Exclusão", icon: Trash2, className: "bg-destructive/10 text-destructive border-destructive/20" },
  anonimizacao: { label: "Anonimização", icon: Shield, className: "bg-success/10 text-success border-success/20" },
};

export default function LGPD() {
  return (
    <div>
      <AdminHeader title="LGPD & Conformidade" subtitle="Auditoria e controle de dados pessoais" />

      <div className="p-6 space-y-6">
        {/* Policy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PolicyCard
            icon={Shield}
            title="Consentimentos"
            description="Registro granular por tipo: marketing, dados pessoais, cookies"
            status="Ativo"
          />
          <PolicyCard
            icon={Trash2}
            title="Direito ao Esquecimento"
            description="Exclusão e anonimização de dados sob demanda"
            status="Configurado"
          />
          <PolicyCard
            icon={FileText}
            title="Logs de Auditoria"
            description="Rastreamento completo de acessos e operações com dados"
            status="Ativo"
          />
        </div>

        {/* Audit Logs */}
        <div className="bg-card rounded-xl border border-border animate-fade-in">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Logs de Auditoria Recentes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-5 py-3 font-medium">Usuário</th>
                  <th className="text-left px-5 py-3 font-medium">Ação</th>
                  <th className="text-left px-5 py-3 font-medium">Tabela</th>
                  <th className="text-left px-5 py-3 font-medium">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {logsAuditoria.map((log) => {
                  const config = acaoConfig[log.acao];
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-foreground">{log.usuario}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={config.className}>
                          <config.icon size={12} className="mr-1" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">{log.tabela}</td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">{log.data}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyCard({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Icon size={20} className="text-primary" />
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">
          {status}
        </Badge>
      </div>
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
